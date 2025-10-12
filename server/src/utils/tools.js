import { tool } from "ai";
import z from "zod";
import Task from '../models/Task.js';

// Local time tool definition
const timeTool = tool({
    name: "getCurrentTime",
    description: "Returns the current time in a specified timezone.",
    inputSchema: z.object({
        timezone: z
            .string()
            .default("UTC")
            .describe("The IANA timezone identifier (e.g., 'America/New_York', 'Asia/Tokyo').")
    }),
    execute: async (input) => {
        const { timezone } = input;

        console.log(`🕒 Fetching current time for timezone: ${timezone}`);

        try {
            const currentTime = new Date().toLocaleString("en-US", {
                timeZone: timezone
            });

            console.log(`✅ Current time in ${timezone}: ${currentTime}`);
            return { currentTime }; // return as structured object for clarity
        } catch (error) {
            console.error(`❌ Error fetching time for ${timezone}: ${error.message}`);
            throw new Error(`Failed to fetch current time: ${error.message}`);
        }
    }
});

const taskTool = tool({
    name: "taskTool",
    description: "Manages user tasks with CRUD operations: create, read, update, delete tasks.",
    inputSchema: z.object({
        action: z.enum(['create', 'read', 'update', 'delete']).describe("The action to perform on tasks."),
        title: z.string().optional().describe("Task title (required for create and update)."),
        description: z.string().optional().describe("Task description."),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe("Task status."),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe("Task priority."),
        taskId: z.string().optional().describe("Task ID (required for update and delete)."),
        dueDate: z.string().optional().describe("Due date in ISO format (e.g., '2024-12-31T23:59:59Z')."),
        tags: z.array(z.string()).optional().describe("Array of tags for the task."),
        filters: z.object({
            status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            limit: z.number().min(1).max(100).optional().default(20),
            offset: z.number().min(0).optional().default(0)
        }).optional().describe("Filters for reading tasks.")
    }),
    execute: async (input, { experimental_context: context }) => {
        const { action, title, description, status, priority, taskId, dueDate, tags, filters } = input;
        const { userId } = context;

        console.log(`🛠️ Task action: ${action} for user: ${userId}`);

        try {
            switch (action) {
                case 'create': {
                    if (!title) {
                        throw new Error('Title is required for creating a task');
                    }

                    const taskData = {
                        title,
                        user: userId,
                        ...(description && { description }),
                        ...(status && { status }),
                        ...(priority && { priority }),
                        ...(dueDate && { dueDate: new Date(dueDate) }),
                        ...(tags && { tags })
                    };

                    const newTask = new Task(taskData);
                    const savedTask = await newTask.save();

                    console.log(`✅ Task created: ${savedTask._id}`);
                    return {
                        success: true,
                        action: 'create',
                        task: savedTask.toJSON()
                    };
                }

                case 'read': {
                    const query = { user: userId, isActive: true };
                    const options = {
                        sort: { createdAt: -1 },
                        limit: 20,
                        offset: 0
                    };

                    if (filters) {
                        if (filters.status) query.status = filters.status;
                        if (filters.priority) query.priority = filters.priority;
                        if (filters.limit) options.limit = filters.limit;
                        if (filters.offset) options.offset = filters.offset;
                    }

                    const tasks = await Task.find(query)
                        .sort(options.sort)
                        .limit(options.limit)
                        .skip(options.offset)
                        .populate('user', 'name email');

                    const totalCount = await Task.countDocuments(query);

                    console.log(`✅ Retrieved ${tasks.length} tasks for user: ${userId}`);
                    return {
                        success: true,
                        action: 'read',
                        tasks: tasks.map(task => task.toJSON()),
                        totalCount,
                        filters: filters || {},
                        pagination: {
                            limit: options.limit,
                            offset: options.offset
                        }
                    };
                }

                case 'update': {
                    if (!taskId) {
                        throw new Error('Task ID is required for updating a task');
                    }

                    const updateData = {};
                    if (title !== undefined) updateData.title = title;
                    if (description !== undefined) updateData.description = description;
                    if (status) updateData.status = status;
                    if (priority) updateData.priority = priority;
                    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
                    if (tags !== undefined) updateData.tags = tags;

                    const updatedTask = await Task.findOneAndUpdate(
                        { _id: taskId, user: userId, isActive: true },
                        updateData,
                        { new: true, runValidators: true }
                    ).populate('user', 'name email');

                    if (!updatedTask) {
                        throw new Error('Task not found or access denied');
                    }

                    console.log(`✅ Task updated: ${taskId}`);
                    return {
                        success: true,
                        action: 'update',
                        task: updatedTask.toJSON()
                    };
                }

                case 'delete': {
                    if (!taskId) {
                        throw new Error('Task ID is required for deleting a task');
                    }

                    // Soft delete by setting isActive to false
                    const deletedTask = await Task.findOneAndUpdate(
                        { _id: taskId, user: userId, isActive: true },
                        { isActive: false },
                        { new: true }
                    );

                    if (!deletedTask) {
                        throw new Error('Task not found or access denied');
                    }

                    console.log(`✅ Task deleted: ${taskId}`);
                    return {
                        success: true,
                        action: 'delete',
                        taskId,
                        message: 'Task deleted successfully'
                    };
                }

                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            console.error(`❌ Task operation failed: ${error.message}`);
            return {
                success: false,
                action,
                error: error.message
            };
        }
    }
});

export { timeTool, taskTool };


// 🧩 Merge local tools with MCP tools
export async function getMergedTools() {
    try {
        // Use global MCP client if available
        const mcpResult = global.mcpClient;

        if (mcpResult && mcpResult.tools) {
            const mcpTools = mcpResult.tools;

            // Merge remote tools with local tools
            const mergedTools = {
                ...mcpTools,
                getCurrentTime: timeTool,
                taskTool: taskTool
            };

            console.log(`🛠️ Merged tools available: ${Object.keys(mergedTools).join(", ")}`);

            return {
                tools: mergedTools,
                close: mcpResult.close
            };
        } else {
            // No MCP client available, use local tools only
            console.log(`🛠️ Using local tools only (no MCP connection)`);
            return {
                tools: { getCurrentTime: timeTool, taskTool: taskTool },
                close: async () => {}
            };
        }
    } catch (error) {
        console.warn(`⚠️ Failed to load MCP tools: ${error.message}. Using local tools only.`);
        return {
            tools: { getCurrentTime: timeTool, taskTool: taskTool },
            close: async () => {}
        };
    }
}

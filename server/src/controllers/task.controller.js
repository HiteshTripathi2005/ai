import Task from '../models/Task.js';

// Get all tasks for a user
export const getTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, priority, limit = 20, offset = 0 } = req.query;

        // Build query
        const query = { user: userId, isActive: true };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (priority && priority !== 'all') {
            query.priority = priority;
        }

        // Get tasks with pagination
        const tasks = await Task.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .populate('user', 'name email');

        // Get total count for pagination
        const totalCount = await Task.countDocuments(query);

        res.status(200).json({
            success: true,
            tasks: tasks.map(task => task.toJSON()),
            totalCount,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks'
        });
    }
};

// Get a single task
export const getTask = async (req, res) => {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;

        const task = await Task.findOne({
            _id: taskId,
            user: userId,
            isActive: true
        }).populate('user', 'name email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            task: task.toJSON()
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch task'
        });
    }
};

// Create a new task
export const createTask = async (req, res) => {
    try {
        const userId = req.user._id;
        const { title, description, status = 'pending', priority = 'medium', dueDate, tags } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        // Create task
        const taskData = {
            title: title.trim(),
            user: userId,
            ...(description && { description: description.trim() }),
            ...(status && { status }),
            ...(priority && { priority }),
            ...(dueDate && { dueDate: new Date(dueDate) }),
            ...(tags && { tags })
        };

        const newTask = new Task(taskData);
        const savedTask = await newTask.save();

        // Populate user data
        await savedTask.populate('user', 'name email');

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: savedTask.toJSON()
        });
    } catch (error) {
        console.error('Error creating task:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create task'
        });
    }
};

// Update a task
export const updateTask = async (req, res) => {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;
        const { title, description, status, priority, dueDate, tags } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : '';
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (tags !== undefined) updateData.tags = tags;

        // Validate that at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields provided for update'
            });
        }

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, user: userId, isActive: true },
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'name email');

        if (!updatedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task: updatedTask.toJSON()
        });
    } catch (error) {
        console.error('Error updating task:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update task'
        });
    }
};

// Delete a task (soft delete)
export const deleteTask = async (req, res) => {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;

        const deletedTask = await Task.findOneAndUpdate(
            { _id: taskId, user: userId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!deletedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
            taskId
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete task'
        });
    }
};

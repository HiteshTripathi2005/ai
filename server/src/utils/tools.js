// time tool using vercel ai sdk
import { tool } from "ai";
import z from "zod"
import { mcpToolsFromSmithery } from './mcp.js';

const timeTool = tool({
    name: "getCurrentTime",
    description: "Get the current time in a specified timezone",
    inputSchema: z.object({
        timezone: z.string().default("UTC")
    }),
    execute: async (input) => {
        const { timezone } = input;
        console.log(`Fetching current time for timezone: ${timezone}`);
        const currentTime = new Date().toLocaleString("en-US", { timeZone: timezone });
        console.log(`Current time in ${timezone}: ${currentTime}`);
        return currentTime;
    }
})

// Function to merge local tools with MCP tools
export async function getMergedTools() {
    try {
        // Load MCP tools
        const mcpResult = await mcpToolsFromSmithery();
        const mcpTools = mcpResult.tools;

        // Merge with local tools
        const mergedTools = {
            ...mcpTools,
            timeTool
        };

        console.log(`🛠️ Merged tools: ${Object.keys(mergedTools).join(', ')}`);

        return {
            tools: mergedTools,
            close: mcpResult.close
        };
    } catch (error) {
        console.warn('⚠️ Failed to load MCP tools, using local tools only:', error.message);
        // Return local tools only if MCP fails
        return {
            tools: { timeTool },
            close: async () => {} // No-op close function
        };
    }
}

export { timeTool };
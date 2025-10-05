import { tool } from "ai";
import z from "zod";
import { mcpToolsFromSmithery } from "./mcp.js";

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

export { timeTool };


// 🧩 Merge local tools with MCP tools
export async function getMergedTools() {
    try {
        // Load remote tools from MCP
        const mcpResult = await mcpToolsFromSmithery();
        const mcpTools = mcpResult.tools ?? {};

        // Merge remote tools with local tools
        const mergedTools = {
            ...mcpTools,
            getCurrentTime: timeTool
        };

        console.log(`🛠️ Merged tools available: ${Object.keys(mergedTools).join(", ")}`);

        return {
            tools: mergedTools,
            close: mcpResult.close
        };
    } catch (error) {
        console.warn(`⚠️ Failed to load MCP tools: ${error.message}. Using local tools only.`);
        return {
            tools: { getCurrentTime: timeTool },
            close: async () => {} // 
        };
    }
}

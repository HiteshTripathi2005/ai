import app from "./app.js";
import {config} from "dotenv";
import { mcpToolsFromSmithery } from "./utils/mcp.js";

config();

const PORT = process.env.PORT || 5000;

// Global variable to store MCP client
let globalMcpClient = null;

// Connect to MCP services before starting server
async function initializeMCP() {
    try {
        console.log("🔄 Connecting to MCP services...");
        const mcpResult = await mcpToolsFromSmithery();
        globalMcpClient = mcpResult;

        // Make MCP client available globally AFTER successful connection
        global.mcpClient = mcpResult;

        const toolCount = Object.keys(mcpResult.tools || {}).length;
        console.log(`✅ Successfully connected to MCP services. ${toolCount} tools available.`);

        return mcpResult;
    } catch (error) {
        console.warn(`⚠️ Failed to connect to MCP services: ${error.message}`);
        console.log("🚀 Starting server with local tools only...");
        global.mcpClient = null; // Ensure global is set to null on failure
        return null;
    }
}

// Initialize MCP and start server
initializeMCP().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("❌ Critical error during MCP initialization:", error);
    process.exit(1);
});

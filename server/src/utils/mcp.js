// MCP functionality temporarily disabled due to AI SDK version compatibility
// The experimental_createMCPClient has been removed from the ai package
// TODO: Update to use the new MCP API when available

/**
 * Load MCP tools from multiple MCP URLs and merge them into a single handle.
 * Currently disabled - returns empty tools.
 */
export async function mcpToolsFromSources(sources) {
    console.warn('⚠️ MCP tools are currently disabled due to AI SDK compatibility issues');

    return {
        tools: {},
        close: async () => {
            // No-op
        }
    };
}

/**
 * Convenience wrapper that returns tools from the original Smithery MCP URL.
 * Currently disabled - returns empty tools.
 */
export async function mcpToolsFromSmithery(urls) {
    console.warn('⚠️ MCP tools from Smithery are currently disabled due to AI SDK compatibility issues');

    return {
        tools: {},
        close: async () => {
            // No-op
        }
    };
}

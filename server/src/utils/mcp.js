import { experimental_createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';


/**
 * Load MCP tools from multiple MCP URLs and merge them into a single handle.
 * If multiple MCPs provide tools with the same name, the later/remote tool will
 * be namespaced using the remote hostname to avoid collisions (e.g. "toolsrv_example_com__toolName").
 */
export async function mcpToolsFromSources(sources) {
    if (!sources || sources.length === 0) throw new Error('No MCP sources provided');

    const merged = {};
    const clients = [];

    for (const raw of sources) {
        try {
            const url = new URL(raw);
            const transport = url.pathname.includes('/mcp')
                ? new StreamableHTTPClientTransport(url)
                : new SSEClientTransport(url);

            const client = await (experimental_createMCPClient)({ transport }, {});
            clients.push(client);

            const fetched = (await client.tools());

            // Namespace collisions using hostname
            const hostTag = url.hostname.replace(/[^a-zA-Z0-9]/g, '_') || 'mcp';

            for (const [name, t] of Object.entries(fetched)) {
                let targetName = name;
                if (merged[targetName]) {
                    // collision — namespace with host
                    targetName = `${hostTag}__${name}`;
                    console.warn(`🛠️ MCP tool name collision for "${name}", registering as "${targetName}"`);
                }

                // Wrap execute with logging — but only if it exists; also forward (args, options)
                const originalExecute = t.execute;

                if (typeof originalExecute === 'function') {
                    t.execute = async (args, options) => {
                        console.log(`🛠️ MCP tool "${targetName}" was called with args:`, args);
                        const out = await originalExecute(args, options);
                        console.log(`📤 MCP tool "${targetName}" result:`, out);
                        return out;
                    };
                }

                merged[targetName] = t;
            }
        } catch (err) {
            console.warn('⚠️ Failed to load MCP from', raw, err instanceof Error ? err.message : err);
        }
    }

    return {
        tools: merged,
        close: async () => {
            for (const c of clients) {
                try {
                    if (c && typeof c.close === 'function') await c.close();
                } catch (closeErr) {
                    console.warn('⚠️ Error closing MCP client:', closeErr instanceof Error ? closeErr.message : closeErr);
                }
            }
        }
    };
}

/**
 * Convenience wrapper that returns tools from the original Smithery MCP URL.
 * Keep this for backwards compatibility.
 * 
 * User can provide URLs without api_key/profile; these will be appended automatically.
 */
export async function mcpToolsFromSmithery(urls) {
    const apiKey = process.env.MCP_API_KEY;
    const profile = process.env.MCP_PROFILE;
    if (!apiKey || !profile) {
        throw new Error('MCP_API_KEY and MCP_PROFILE must be set in environment variables');
    }
    // Default URLs if none provided
    const baseUrls = urls && urls.length > 0
        ? urls
        : [
                // "https://server.smithery.ai/exa/mcp",
                // "https://server.smithery.ai/@esshka/okx-mcp/mcp",
                // "https://server.smithery.ai/@cloudflare/playwright-mcp/mcp",
                // "https://server.smithery.ai/@hwangwoohyun-nav/yahoo-finance-mcp/mcp",
                // "https://server.smithery.ai/@imbenrabi/financial-modeling-prep-mcp-server/mcp",
                // "https://server.smithery.ai/@HarunGuclu/weather_mcp/mcp",
                // "https://server.smithery.ai/@smithery-ai/github/mcp",
                // "https://server.smithery.ai/@githejie/mcp-server-calculator/mcp"
                // "https://server.smithery.ai/@glassBead-tc/weather-mcp/mcp",
                // "https://server.smithery.ai/@nickclyde/duckduckgo-mcp-server/mcp",
            ];
    // Append api_key and profile to each URL
    const defaultUrl = baseUrls.map(u => {
        const url = new URL(u);
        url.searchParams.set('api_key', apiKey);
        url.searchParams.set('profile', profile);
        return url.toString();
    });
    return mcpToolsFromSources(defaultUrl);
}

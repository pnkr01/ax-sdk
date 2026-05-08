import type { AxAnalytics } from '../index.js';

export class McpInterceptor {
    private ax: AxAnalytics;

    constructor(axInstance: AxAnalytics) {
        this.ax = axInstance;
    }

    /**
     * Instruments an MCP Server instance to automatically capture telemetry
     * for all tool executions. Uses duck-typing to maintain zero dependencies.
     * * @param server The MCP Server instance
     */
    public instrumentServer(server: any): void {
        // Duck-typing check: Ensure it looks and acts like an MCP Server
        if (!server || typeof server.setRequestHandler !== 'function') {
            this.logWarning('Invalid MCP Server instance provided for instrumentation. Missing setRequestHandler.');
            return;
        }

        // Store the original method so we can call it later
        const originalSetRequestHandler = server.setRequestHandler.bind(server);

        // Intercept and override the method
        server.setRequestHandler = (schema: any, handler: any) => {
            // MCP Standard: The method for executing tools is exactly 'tools/call'
            if (schema?.method === 'tools/call') {
                
                // Create a new handler that wraps their original logic
                const instrumentedHandler = async (request: any, context: any) => {
                    // Extract the tool name dynamically from the MCP request payload
                    const toolName = request?.params?.name || 'unknown_mcp_tool';

                    // Execute within our highly-resilient telemetry wrapper
                    return this.ax.wrapTool(toolName, async () => {
                        return await handler(request, context);
                    });
                };

                // Register our wrapped handler instead of theirs
                return originalSetRequestHandler(schema, instrumentedHandler);
            }

            // If it's NOT a tool call (e.g., 'resources/list', 'prompts/get'), 
            // just register it normally without adding overhead.
            return originalSetRequestHandler(schema, handler);
        };
    }

    private logWarning(msg: string): void {
        const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
        if (isDev) console.warn(`[AX-SDK Interceptor] ${msg}`);
    }
}
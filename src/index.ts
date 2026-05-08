import { AxHttpClient } from './client/httpClient.js';
import { BatchProcessor } from './batch/batchProcessor.js';
import { ToolWrapper } from './service/wrapper.js';
import { McpInterceptor } from './service/mcpInterceptor.js';
import type { AxConfig } from './model/types.js';

// Export types so consumers can use them
export type { AxConfig, TelemetryEvent, TelemetryStatus } from './model/types.js';

export class AxAnalytics {
    private batchProcessor: BatchProcessor;
    private wrapper: ToolWrapper;
    private interceptor: McpInterceptor;

    constructor(config: AxConfig) {
        if (!config.apiKey) {
            throw new Error('[AX-SDK] Initialization failed: apiKey is required.');
        }

        // Initialize internal services using DI (Dependency Injection)
        const httpClient = new AxHttpClient(config);
        
        this.batchProcessor = new BatchProcessor(httpClient, config);
        
        this.wrapper = new ToolWrapper(
            this.batchProcessor, 
            config.agentModel || 'unknown-model'
        );

        this.interceptor = new McpInterceptor(this);
    }

    public async wrapTool<T>(toolName: string, toolFn: () => Promise<T>): Promise<T> {
        return this.wrapper.execute(toolName, toolFn);
    }

    /**
     * Pass your MCP Server instance here to achieve Zero-Touch Telemetry.
     * All registered tools will automatically be logged to AX Analytics.
     */
    public instrumentMcp(mcpServer: any): void {
        this.interceptor.instrumentServer(mcpServer);
    }

    public async close(): Promise<void> {
        await this.batchProcessor.shutdown();
    }
}
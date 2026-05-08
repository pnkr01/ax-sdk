import { v4 as uuidv4 } from 'uuid';
import type { BatchProcessor } from '../batch/batchProcessor.js';

export class ToolWrapper {
    private batcher: BatchProcessor;
    private agentModel: string;

    constructor(batcher: BatchProcessor, agentModel: string) {
        this.batcher = batcher;
        this.agentModel = agentModel;
    }

    async execute<T>(toolName: string, toolFn: () => Promise<T>): Promise<T> {
        const traceId = uuidv4();
        const startTime = Date.now();

        try {
            const result = await toolFn();
            const durationMs = Date.now() - startTime;

            this.batcher.enqueue({
                traceId,
                agentModel: this.agentModel,
                toolName,
                payloadSize: this.calculatePayloadSize(result),
                status: 'SUCCESS',
                durationMs
            });

            return result;
        } catch (error) {
            const durationMs = Date.now() - startTime;

            this.batcher.enqueue({
                traceId,
                agentModel: this.agentModel,
                toolName,
                payloadSize: 0, // Payloads failed to generate
                status: 'ERROR',
                durationMs
            });

            throw error; // Re-throw so the host app functions normally
        }
    }

    /**
     * Safely serializes objects, handling circular references that would otherwise
     * cause JSON.stringify to throw an unhandled TypeError.
     */
    private calculatePayloadSize(data: unknown): number {
        if (data === undefined || data === null) return 0;
        if (typeof data === 'string') return data.length;
        
        try {
            // Quick happy-path check
            return JSON.stringify(data).length;
        } catch (err) {
            // Fallback for circular structures or BigInts
            return String(data).length;
        }
    }
}
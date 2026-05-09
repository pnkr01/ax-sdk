import { AX_CONSTANTS } from '../constant/constants.js';
import type { AxConfig, TelemetryEvent } from '../model/types.js';

export class AxHttpClient {
    private readonly baseUrl: string;
    private readonly timeoutMs: number;
    private readonly headers: HeadersInit;

    constructor(config: AxConfig) {
        this.baseUrl = config.baseUrl || AX_CONSTANTS.DEFAULT_BASE_URL;
        this.timeoutMs = AX_CONSTANTS.DEFAULT_TIMEOUT_MS;
        this.headers = {
            'X-API-Key': config.apiKey,
            'Content-Type': 'application/json',
            'X-SDK-Version': '1.0.0'
        };
    }

    /**
     * Sends a batch of events using native Node.js fetch.
     * Includes a strict abort controller to prevent hanging sockets.
     */
   async sendBatch(events: TelemetryEvent[]): Promise<void> {
        if (events.length === 0) return;

        const formattedEvents = events.map(event => ({
            trace_id: event.traceId,
            agent_model: event.agentModel,
            tool_name: event.toolName,
            payload_size: event.payloadSize,
            status: event.status,
            durationMs: event.durationMs // This one is camelCase in your Go struct!
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/v1/ingest/batch`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ events: formattedEvents }), // Send the mapped data
                signal: controller.signal
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error body');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`AX Http Client Error: Request timed out after ${this.timeoutMs}ms`);
            }
            throw new Error(`AX Http Client Error: ${(error as Error).message}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
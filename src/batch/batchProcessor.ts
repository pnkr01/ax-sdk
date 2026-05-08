import type { AxHttpClient } from '../client/httpClient.js';
import type { TelemetryEvent, AxConfig, AxLogger } from '../model/types.js';
import { AX_CONSTANTS } from '../constant/constants.js';

export class BatchProcessor {
    private buffer: TelemetryEvent[] = [];
    private httpClient: AxHttpClient;
    
    // Edge-safe timer type
    private timer: ReturnType<typeof setInterval> | null = null;
    
    private isFlushing: boolean = false;
    private readonly maxBufferSize: number;
    private readonly enabled: boolean;
    private readonly logger: AxLogger | undefined;
    private readonly onErrorCb?: (error: Error, droppedEvents: number) => void;

    constructor(httpClient: AxHttpClient, config: AxConfig) {
        this.httpClient = httpClient;
        this.maxBufferSize = config.maxBufferSize || AX_CONSTANTS.DEFAULT_MAX_BUFFER_SIZE;
        this.enabled = config.enabled !== false; // Defaults to true
        this.logger = config.logger;
        this.onErrorCb = config.onError;

        if (!this.enabled) return;

        const flushInterval = config.flushIntervalMs || AX_CONSTANTS.DEFAULT_FLUSH_INTERVAL_MS;
        
        this.timer = setInterval(() => this.flush(), flushInterval);
        
        // Node.js specific: Don't let the timer keep the process alive
        // We use a safe check so it doesn't crash in Edge/Cloudflare environments
        if (typeof this.timer === 'object' && typeof (this.timer as any).unref === 'function') {
            (this.timer as any).unref(); 
        }
    }

    public enqueue(event: TelemetryEvent): void {
        if (!this.enabled) return;

        if (this.buffer.length >= AX_CONSTANTS.ABSOLUTE_MAX_QUEUE_SIZE) {
            this.buffer.shift();
        }

        this.buffer.push(event);

        if (this.buffer.length >= this.maxBufferSize) {
            // Edge-safe replacement for setImmediate
            setTimeout(() => this.flush(), 0);
        }
    }

    public async flush(attempt: number = 0): Promise<void> {
        if (!this.enabled || this.buffer.length === 0 || this.isFlushing) return;

        this.isFlushing = true;
        const batch = [...this.buffer];
        this.buffer = [];

        try {
            await this.httpClient.sendBatch(batch);
            this.isFlushing = false;
        } catch (error) {
            this.isFlushing = false;
            await this.handleRetry(batch, attempt, error as Error);
        }
    }

    private async handleRetry(batch: TelemetryEvent[], attempt: number, originalError: Error): Promise<void> {
        if (attempt < AX_CONSTANTS.MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * AX_CONSTANTS.BACKOFF_BASE_MS;
            setTimeout(() => {
                this.buffer = [...batch, ...this.buffer];
                this.flush(attempt + 1);
            }, delay);
        } else {
            // 🚨 ENTERPRISE UPGRADE: Proper observability routing
            if (this.logger) {
                this.logger.warn(`Dropped ${batch.length} events after ${AX_CONSTANTS.MAX_RETRIES} attempts.`);
            }
            if (this.onErrorCb) {
                this.onErrorCb(originalError, batch.length);
            }
        }
    }

    public async shutdown(): Promise<void> {
        if (this.timer) clearInterval(this.timer);
        await this.flush(); 
    }
}
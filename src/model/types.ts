export type TelemetryStatus = 'SUCCESS' | 'ERROR' | 'HALLUCINATION';

// 🚨 ENTERPRISE UPGRADE: Standardized Logger Interface
export interface AxLogger {
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

export interface AxConfig {
    apiKey: string;
    agentModel?: string;
    baseUrl?: string;
    maxBufferSize?: number;
    flushIntervalMs?: number;
    
    // 🚨 ENTERPRISE UPGRADES
    enabled?: boolean; // Easily turn off in testing/CI
    logger?: AxLogger; // Allow custom Winston/Pino injection
    onError?: (error: Error, droppedEvents: number) => void; // Lifecycle hook
}

export interface TelemetryEvent {
    readonly traceId: string;
    readonly agentModel: string;
    readonly toolName: string;
    readonly payloadSize: number;
    readonly status: TelemetryStatus;
    readonly durationMs: number;
}
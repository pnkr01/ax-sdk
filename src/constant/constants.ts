export const AX_CONSTANTS = {
    DEFAULT_BASE_URL: 'http://localhost:8080',
    DEFAULT_TIMEOUT_MS: 5000,
    
    // Batching Defaults
    DEFAULT_MAX_BUFFER_SIZE: 100,
    DEFAULT_FLUSH_INTERVAL_MS: 5000,
    
    // Safety Limits (Hardcoded to prevent memory leaks)
    ABSOLUTE_MAX_QUEUE_SIZE: 1000, // Drop events if queue exceeds this
    
    // Retry Logic
    MAX_RETRIES: 3,
    BACKOFF_BASE_MS: 200,
} as const;
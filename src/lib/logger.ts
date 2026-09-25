export interface LogEntry {
  requestId?: string;
  userId?: string;
  operation: string;
  processingTimeMs?: number;
  provider?: string;
  status: "START" | "SUCCESS" | "FAILED" | "RETRY" | "INFO" | "WARN";
  errorCode?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = [
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "cookie",
  "client_secret",
  "audioUrl",
  "fileUrl",
];

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = REDACTED_KEYS.some((sec) =>
      k.toLowerCase().includes(sec)
    );
    if (isSensitive) {
      clean[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      clean[k] = sanitize(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const logger = {
  info(entry: LogEntry) {
    const sanitized = sanitize(entry) as Record<string, unknown>;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        ...sanitized,
      })
    );
  },
  warn(entry: LogEntry) {
    const sanitized = sanitize(entry) as Record<string, unknown>;
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "WARN",
        ...sanitized,
      })
    );
  },
  error(entry: LogEntry & { error?: unknown }) {
    const sanitized = sanitize(entry) as Record<string, unknown>;
    const errorMessage =
      entry.error instanceof Error
        ? entry.error.message
        : typeof entry.error === "string"
        ? entry.error
        : undefined;

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        ...sanitized,
        errorMessage,
      })
    );
  },
};

export function demoRequest(path: string, method: 'GET' | 'POST', body?: unknown): Promise<{ status: number; body: unknown }>;

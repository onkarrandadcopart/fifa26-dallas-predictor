export const config = { runtime: 'edge' };

export default async function handler(_req: Request): Promise<Response> {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    kalshiConfigured: !!process.env.KALSHI_API_KEY,
  });
}

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const response = await fetch(`${process.env.API_INTERNAL_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('Backend unavailable');
    return Response.json({ status: 'ok', service: 'topwalker-frontend', backend: await response.json() });
  } catch { return Response.json({ status: 'unavailable' }, { status: 503 }); }
}

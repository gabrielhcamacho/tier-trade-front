export function GET() {
  return Response.json(
    { status: 'ok', service: 'tier-trade-web' },
    { headers: { 'cache-control': 'no-store' } },
  );
}

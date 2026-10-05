import { NextResponse } from 'next/server';
import { currentUserContext } from '../../../../lib/current-user';

export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const [{ documentId }, { identityHeaders }] = await Promise.all([params, currentUserContext()]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || Object.keys(identityHeaders).length === 0) {
    return NextResponse.json({ message: 'Ambiente não configurado.' }, { status: 503 });
  }
  const response = await fetch(`${apiUrl}/v1/documents/${encodeURIComponent(documentId)}/download`, {
    headers: identityHeaders,
    cache: 'no-store',
  });
  if (!response.ok) return NextResponse.json({ message: 'Documento indisponível.' }, { status: response.status });
  const body = await response.json() as { signedUrl: string };
  return NextResponse.redirect(body.signedUrl, 307);
}

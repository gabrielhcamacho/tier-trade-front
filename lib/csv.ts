import { NextResponse } from 'next/server';

export function csvResponse(fileName: string, rows: Array<Array<string | number | null | undefined>>) {
  const body = `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`;
  return new NextResponse(body, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}

function csvCell(value: string | number | null | undefined): string {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

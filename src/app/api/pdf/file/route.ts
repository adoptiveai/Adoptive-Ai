import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const filePath = body.path as string | undefined;
    if (!filePath) {
      return NextResponse.json({ message: 'Missing file path.' }, { status: 400 });
    }

    const resolved = path.resolve(filePath);
    const root = process.cwd();
    if (!resolved.startsWith(root)) {
      return NextResponse.json({ message: 'Access to the requested file is not allowed.' }, { status: 403 });
    }

    const data = await readFile(resolved);
    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(resolved)}"`,
      },
    });
  } catch (error) {
    console.error('PDF file route error', error);
    return NextResponse.json({ message: 'Failed to load PDF file.' }, { status: 500 });
  }
}

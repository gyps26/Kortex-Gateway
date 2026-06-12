import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name');
    if (name === 'worker') {
        const filePath = path.join(process.cwd(), 'mac-worker', 'worker.js');
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return new NextResponse(content, { headers: { 'Content-Type': 'application/javascript' }});
        } catch (err) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    }
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
}

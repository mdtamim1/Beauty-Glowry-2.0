import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { logAdminAction } from '../../../../lib/audit';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Make filename unique and safe
    const sanitisedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `img_${Date.now()}_${sanitisedName}`;

    // Target upload directory: public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    // Log the file upload in the audit log
    await logAdminAction(
      'IMAGE_UPLOAD',
      `Uploaded file "${file.name}" (saved as: ${filename}).`
    );

    return NextResponse.json({ success: true, url: relativeUrl });
  } catch (error: any) {
    console.error('[API Admin Upload POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { logAdminAction } from '../../../../lib/audit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

    // Read S3 configuration
    const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const s3BucketName = process.env.S3_BUCKET_NAME;

    const isS3Configured = s3AccessKeyId && s3SecretAccessKey && s3BucketName;

    let imageUrl = '';

    if (isS3Configured) {
      console.log(`[Upload API] S3 configurations detected. Uploading "${file.name}" to bucket "${s3BucketName}"...`);
      const s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
        forcePathStyle: true, // required for Cloudflare R2 / MinIO
      });

      const command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      });

      await s3Client.send(command);

      // Construct URL
      if (process.env.S3_PUBLIC_URL) {
        imageUrl = `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
      } else if (process.env.S3_ENDPOINT) {
        // e.g. R2 endpoint or MinIO: https://endpoint/bucket/file
        imageUrl = `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${s3BucketName}/${filename}`;
      } else {
        // Standard S3 URL
        imageUrl = `https://${s3BucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
      }

      console.log(`[Upload API] Successfully uploaded to S3: ${imageUrl}`);
    } else {
      console.log(`[Upload API] S3 config missing. Falling back to local filesystem storage for "${file.name}"...`);
      // Target upload directory: public/uploads
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure the folder exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);

      imageUrl = `/uploads/${filename}`;
      console.log(`[Upload API] Local upload complete: ${imageUrl}`);
    }

    // Log the file upload in the audit log
    await logAdminAction(
      'IMAGE_UPLOAD',
      `Uploaded file "${file.name}" (saved as: ${filename}, S3: ${!!isS3Configured}).`
    );

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('[API Admin Upload POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

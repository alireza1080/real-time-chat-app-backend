import { S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import multer from 'multer';

config();

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error('AWS credentials are not set');
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

export { s3Client, upload };

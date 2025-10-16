import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return Response.json({
    hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    clientEmailLength: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.length || 0,
    privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
    // Don't expose actual values, just check if they exist
    clientEmailPreview: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.substring(0, 20) || 'NOT SET',
    privateKeyPreview: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 30) || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  });
}

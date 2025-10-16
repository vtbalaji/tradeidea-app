import { getAdminAuth } from './firebaseAdmin';
import { NextRequest } from 'next/server';

export async function verifyAuthToken(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Unauthorized: Invalid token');
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

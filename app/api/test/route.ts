export async function GET() {
  return Response.json({
    message: 'TradeIdea API is working!',
    timestamp: new Date().toISOString(),
    environment: {
      hasFirebaseKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasFirebaseAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

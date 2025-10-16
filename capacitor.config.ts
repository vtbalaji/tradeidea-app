import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vtbalaji.myportfolio',
  appName: 'My Portfolio',
  webDir: 'out',
  server: {
    // For development: Point to your Vercel deployment
    // Remove or comment out for production builds
    url: 'https://myportfolio-web.vercel.app',
    cleartext: true
  }
};

export default config;

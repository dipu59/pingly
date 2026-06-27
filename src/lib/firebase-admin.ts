import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Prevent client-side usage
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin can only be used on the server side.');
}

function initFirebaseAdmin() {
  // Prevent re-initialization during hot reloads
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    // Safely load serviceAccountKey.json from project root
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.warn('⚠️ serviceAccountKey.json not found in project root. Firebase Admin not initialized.');
      return null;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
}

export const adminApp = initFirebaseAdmin();
export const adminMessaging = adminApp ? admin.messaging() : null;

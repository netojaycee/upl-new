import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Parse service account from environment variable
const getServiceAccount = () => {
    // Method 1: Service Account JSON (from your .env)
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
        try {
            return JSON.parse(serviceAccountKey);
        } catch {
            throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
        }
    }

    throw new Error(
        'Firebase service account credentials not found. ' +
        'Please set FIREBASE_SERVICE_ACCOUNT_KEY in your environment variables'
    );
};

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
    credential: cert(getServiceAccount()),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
};

// Initialize app only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];

export const adminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);

export default app;
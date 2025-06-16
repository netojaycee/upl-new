import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Parse service account from environment variable
const getServiceAccount = () => {
    // Method 1: Service Account JSON (Recommended)
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
        try {
            return JSON.parse(serviceAccountKey);
        } catch {
            throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
        }
    }

    // Method 2: Individual environment variables (Fallback)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        return {
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        };
    }

    throw new Error(
        'Firebase service account credentials not found. ' +
        'Please set either FIREBASE_SERVICE_ACCOUNT_KEY (JSON) or individual environment variables ' +
        '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
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

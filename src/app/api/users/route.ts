import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { User, NewUser } from '@/lib/types';

// GET - Fetch all users
export async function GET() {
    try {
        // Get all users from Firebase Auth
        const listUsersResult = await adminAuth.listUsers();

        // Get user documents from Firestore to get roles
        const userDocs = await adminFirestore.collection('users').get();
        const userDocsMap = new Map();
        userDocs.forEach(doc => {
            userDocsMap.set(doc.id, doc.data());
        });

        const users: User[] = listUsersResult.users.map(userRecord => {
            const firestoreData = userDocsMap.get(userRecord.uid) || {};

            return {
                uid: userRecord.uid,
                email: userRecord.email || '',
                displayName: userRecord.displayName || undefined,
                photoURL: userRecord.photoURL || undefined,
                phoneNumber: userRecord.phoneNumber || undefined,
                disabled: userRecord.disabled,
                emailVerified: userRecord.emailVerified,
                roles: firestoreData.roles || [],
                createdAt: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime || undefined,
                customClaims: userRecord.customClaims || {},
            };
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        const userData: NewUser = await request.json();

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            phoneNumber: userData.phoneNumber,
            emailVerified: userData.emailVerified || false,
            disabled: userData.disabled || false,
        });

        // Create user document in Firestore with roles
        await adminFirestore.collection('users').doc(userRecord.uid).set({
            email: userData.email,
            displayName: userData.displayName || null,
            photoURL: userData.photoURL || null,
            phoneNumber: userData.phoneNumber || null,
            roles: userData.roles || [],
            createdAt: new Date().toISOString(),
            emailVerified: userData.emailVerified || false,
            disabled: userData.disabled || false,
        });

        // Set custom claims if roles are provided
        if (userData.roles && userData.roles.length > 0) {
            await adminAuth.setCustomUserClaims(userRecord.uid, {
                roles: userData.roles,
            });
        }

        const newUser: User = {
            uid: userRecord.uid,
            email: userRecord.email || '',
            displayName: userRecord.displayName || undefined,
            photoURL: userRecord.photoURL || undefined,
            phoneNumber: userRecord.phoneNumber || undefined,
            disabled: userRecord.disabled,
            emailVerified: userRecord.emailVerified,
            roles: userData.roles || [],
            createdAt: userRecord.metadata.creationTime,
            customClaims: { roles: userData.roles || [] },
        };

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}

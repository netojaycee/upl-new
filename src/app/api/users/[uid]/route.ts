import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { UserUpdate } from '@/lib/types';

// GET - Fetch single user
export async function GET(
    request: NextRequest,
    { params }: { params: { uid: string } }
) {
    try {
        const { uid } = await params;

        // Get user from Firebase Auth
        const userRecord = await adminAuth.getUser(uid);

        // Get user document from Firestore
        const userDoc = await adminFirestore.collection('users').doc(uid).get();
        const firestoreData = userDoc.data() || {};

        const user = {
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

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: { uid: string } }
) {
    try {
        const { uid } = params;
        const updateData: UserUpdate = await request.json();

        // Update user in Firebase Auth
        const authUpdateData: any = {};
        if (updateData.displayName !== undefined) authUpdateData.displayName = updateData.displayName;
        if (updateData.photoURL !== undefined) authUpdateData.photoURL = updateData.photoURL;
        if (updateData.phoneNumber !== undefined) authUpdateData.phoneNumber = updateData.phoneNumber;
        if (updateData.disabled !== undefined) authUpdateData.disabled = updateData.disabled;
        if (updateData.emailVerified !== undefined) authUpdateData.emailVerified = updateData.emailVerified;

        if (Object.keys(authUpdateData).length > 0) {
            await adminAuth.updateUser(uid, authUpdateData);
        }

        // Update user document in Firestore
        const firestoreUpdateData: any = {
            updatedAt: new Date().toISOString(),
        };
        if (updateData.displayName !== undefined) firestoreUpdateData.displayName = updateData.displayName;
        if (updateData.photoURL !== undefined) firestoreUpdateData.photoURL = updateData.photoURL;
        if (updateData.phoneNumber !== undefined) firestoreUpdateData.phoneNumber = updateData.phoneNumber;
        if (updateData.disabled !== undefined) firestoreUpdateData.disabled = updateData.disabled;
        if (updateData.emailVerified !== undefined) firestoreUpdateData.emailVerified = updateData.emailVerified;
        if (updateData.roles !== undefined) firestoreUpdateData.roles = updateData.roles;

        await adminFirestore.collection('users').doc(uid).update(firestoreUpdateData);

        // Update custom claims if roles are provided
        if (updateData.roles !== undefined) {
            const customClaims = updateData.customClaims || {};
            customClaims.roles = updateData.roles;
            await adminAuth.setCustomUserClaims(uid, customClaims);
        } else if (updateData.customClaims !== undefined) {
            await adminAuth.setCustomUserClaims(uid, updateData.customClaims);
        }

        // Get updated user
        const userRecord = await adminAuth.getUser(uid);
        const userDoc = await adminFirestore.collection('users').doc(uid).get();
        const userData = userDoc.data() || {};

        const updatedUser = {
            uid: userRecord.uid,
            email: userRecord.email || '',
            displayName: userRecord.displayName || undefined,
            photoURL: userRecord.photoURL || undefined,
            phoneNumber: userRecord.phoneNumber || undefined,
            disabled: userRecord.disabled,
            emailVerified: userRecord.emailVerified,
            roles: userData.roles || [],
            createdAt: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime || undefined,
            customClaims: userRecord.customClaims || {},
        };

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user completely (both Auth and Firestore)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { uid: string } }
) {
    try {
        const { uid } = params;

        // Delete user from Firebase Auth (this prevents them from logging in)
        await adminAuth.deleteUser(uid);

        // Delete user document from Firestore
        await adminFirestore.collection('users').doc(uid).delete();

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "../../../lib/firebase-admin";

// GET - Fetch all users
export async function GET() {
    try {
        // Get all users from Firebase Auth
        const listUsersResult = await adminAuth.listUsers();

        // Get user documents from Firestore to get roles
        const usersCollection = adminFirestore.collection("users");
        const userDocsSnapshot = await usersCollection.get();

        // console.log("Total user documents found:", userDocsSnapshot.size);

        // Create a map of user documents for quick lookup by UID
        const userDocsMap = new Map();
        userDocsSnapshot.forEach(doc => {
            const userData = doc.data();
            console.log(`User document ${doc.id}:`, userData);
            userDocsMap.set(doc.id, userData); // Use doc.id which is UID
        });

        // console.log("User documents map size:", userDocsMap.size);
        // Combine Firebase Auth users with Firestore user data
        console.log("Auth users count:", listUsersResult.users);
        const users = listUsersResult.users.map(authUser => {
            const userDoc = userDocsMap.get(authUser.uid) || {};
            // console.log(`Mapping user ${authUser.uid}: auth email=${authUser.email}, doc data=`, userDoc);

            return {
                uid: authUser.uid,
                email: authUser.email || "",
                displayName: authUser.displayName || "",
                photoURL: authUser.photoURL || userDoc.imageUrl || "", // Use photoURL from Auth or imageUrl from Firestore
                disabled: authUser.disabled,
                emailVerified: authUser.emailVerified,
                phoneNumber: authUser.phoneNumber || "",
                createdAt: authUser.metadata.creationTime || new Date().toISOString(),
                lastSignIn: authUser.metadata.lastSignInTime || "",
                roles: userDoc.roles || [],
            };
        });

        // console.log("Final users with roles:", users.map(u => ({ uid: u.uid, email: u.email, roles: u.roles })));

        // Sort users alphabetically by display name, then by email if no display name
        const sortedUsers = users.sort((a, b) => {
            const nameA = (a.displayName || a.email || '').toLowerCase();
            const nameB = (b.displayName || b.email || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        return NextResponse.json(sortedUsers);
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Failed to fetch users", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, displayName, photoURL, roles, disabled, emailVerified, phoneNumber } = body;

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: displayName || undefined,
            photoURL: photoURL || undefined,
            disabled: disabled || false,
            emailVerified: emailVerified || false,
            phoneNumber: phoneNumber || undefined,
        });

        // Create user document in Firestore
        const userDocData = {
            roles: roles || [],
            imageUrl: photoURL || "", // Store as imageUrl in Firestore for consistency
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await adminFirestore.collection("users").doc(userRecord.uid).set(userDocData);

        // Return the complete user data
        const newUser = {
            uid: userRecord.uid,
            email: userRecord.email || "",
            displayName: userRecord.displayName || "",
            photoURL: userRecord.photoURL || "",
            disabled: userRecord.disabled,
            emailVerified: userRecord.emailVerified,
            phoneNumber: userRecord.phoneNumber || "",
            createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
            lastSignIn: userRecord.metadata.lastSignInTime || "",
            roles: userDocData.roles,
        };

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { message: "Failed to create user", error: error.message },
            { status: 500 }
        );
    }
}
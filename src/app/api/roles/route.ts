import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { getApps, initializeApp } from "firebase/app";

// Initialize Firebase (if not already initialized)
if (!getApps().length) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// GET - Fetch all roles
export async function GET() {
  try {
    const rolesCollection = collection(db, "roles");
    const rolesSnapshot = await getDocs(rolesCollection);
    
    const roles = rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { message: "Failed to fetch roles", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissions, isSystem } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: "Role name is required" },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const rolesCollection = collection(db, "roles");
    const existingRoleQuery = query(rolesCollection, where("name", "==", name));
    const existingRoleSnapshot = await getDocs(existingRoleQuery);

    if (!existingRoleSnapshot.empty) {
      return NextResponse.json(
        { message: "Role with this name already exists" },
        { status: 400 }
      );
    }

    // Create new role
    const roleData = {
      name,
      description: description || "",
      permissions: permissions || [],
      isSystem: isSystem || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(rolesCollection, roleData);

    const newRole = {
      id: docRef.id,
      ...roleData,
    };

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { message: "Failed to create role", error: error.message },
      { status: 500 }
    );
  }
}

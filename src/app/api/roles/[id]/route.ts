import {  NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
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

// GET - Fetch a specific role
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roleRef = doc(db, "roles", id);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return NextResponse.json(
        { message: "Role not found" },
        { status: 404 }
      );
    }

    const role = {
      id: roleSnap.id,
      ...roleSnap.data(),
    };

    return NextResponse.json(role);
  } catch (error: any) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { message: "Failed to fetch role", error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a specific role
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissions } = body;

    const roleRef = doc(db, "roles", id);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return NextResponse.json(
        { message: "Role not found" },
        { status: 404 }
      );
    }

    const roleData = roleSnap.data();

    // Prevent editing system roles
    if (roleData.isSystem) {
      return NextResponse.json(
        { message: "System roles cannot be modified" },
        { status: 403 }
      );
    }

    // Update role data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    await updateDoc(roleRef, updateData);

    const updatedRole = {
      id,
      ...roleData,
      ...updateData,
    };

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { message: "Failed to update role", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific role
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roleRef = doc(db, "roles", id);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return NextResponse.json(
        { message: "Role not found" },
        { status: 404 }
      );
    }

    const roleData = roleSnap.data();

    // Prevent deleting system roles
    if (roleData.isSystem) {
      return NextResponse.json(
        { message: "System roles cannot be deleted" },
        { status: 403 }
      );
    }

    await deleteDoc(roleRef);

    return NextResponse.json(
      { message: "Role deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { message: "Failed to delete role", error: error.message },
      { status: 500 }
    );
  }
}

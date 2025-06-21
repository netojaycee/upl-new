import { NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "../../../../lib/firebase-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;
    const userRecord = await adminAuth.getUser(uid);
    const userDoc = await adminFirestore.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() as any : { roles: [] };

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || userData.imageUrl || "",
      disabled: userRecord.disabled,
      emailVerified: userRecord.emailVerified,
      phoneNumber: userRecord.phoneNumber || "",
      createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
      lastSignIn: userRecord.metadata.lastSignInTime || "",
      roles: userData.roles || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch user", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const { displayName, photoURL, disabled, emailVerified, roles, phoneNumber } = body;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (disabled !== undefined) updateData.disabled = disabled;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    let userRecord;
    if (Object.keys(updateData).length > 0) {
      userRecord = await adminAuth.updateUser(uid, updateData);
    } else {
      userRecord = await adminAuth.getUser(uid);
    }

    const userDocUpdate: any = { updatedAt: new Date().toISOString() };
    if (roles !== undefined) userDocUpdate.roles = roles;
    if (photoURL !== undefined) userDocUpdate.imageUrl = photoURL; // Store as imageUrl in Firestore

    // Use set with merge to ensure document exists
    await adminFirestore.collection("users").doc(uid).set(userDocUpdate, { merge: true });
    const userDocResult = await adminFirestore.collection("users").doc(uid).get();
    const updatedUserData = userDocResult.exists ? userDocResult.data() as any : { roles: [] };

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || updatedUserData.imageUrl || "",
      disabled: userRecord.disabled,
      emailVerified: userRecord.emailVerified,
      phoneNumber: userRecord.phoneNumber || "",
      createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
      lastSignIn: userRecord.metadata.lastSignInTime || "",
      roles: updatedUserData.roles || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update user", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params;
    await adminAuth.deleteUser(uid);
    await adminFirestore.collection("users").doc(uid).delete();
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to delete user", error: error.message },
      { status: 500 }
    );
  }
}

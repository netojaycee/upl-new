import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { Role } from '@/lib/types';

// GET - Fetch single role
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const roleDoc = await adminFirestore.collection('roles').doc(id).get();

        if (!roleDoc.exists) {
            return NextResponse.json(
                { error: 'Role not found' },
                { status: 404 }
            );
        }

        const role: Role = {
            id: roleDoc.id,
            ...roleDoc.data(),
        } as Role;

        return NextResponse.json(role);
    } catch (error) {
        console.error('Error fetching role:', error);
        return NextResponse.json(
            { error: 'Failed to fetch role' },
            { status: 500 }
        );
    }
}

// PUT - Update role
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const updateData = await request.json();

        // Check if role exists
        const roleDoc = await adminFirestore.collection('roles').doc(id).get();
        if (!roleDoc.exists) {
            return NextResponse.json(
                { error: 'Role not found' },
                { status: 404 }
            );
        }

        const currentData = roleDoc.data();

        // Prevent updating system roles
        if (currentData?.isSystem) {
            return NextResponse.json(
                { error: 'Cannot update system roles' },
                { status: 403 }
            );
        }

        // Check if new name conflicts with existing roles
        if (updateData.name && updateData.name !== currentData?.name) {
            const existingRole = await adminFirestore
                .collection('roles')
                .where('name', '==', updateData.name)
                .get();

            if (!existingRole.empty) {
                return NextResponse.json(
                    { error: 'Role with this name already exists' },
                    { status: 400 }
                );
            }
        }

        const updatedData = {
            ...updateData,
            updatedAt: new Date().toISOString(),
        };

        await adminFirestore.collection('roles').doc(id).update(updatedData);

        // Get updated role
        const updatedDoc = await adminFirestore.collection('roles').doc(id).get();
        const updatedRole: Role = {
            id: updatedDoc.id,
            ...updatedDoc.data(),
        } as Role;

        return NextResponse.json(updatedRole);
    } catch (error) {
        console.error('Error updating role:', error);
        return NextResponse.json(
            { error: 'Failed to update role' },
            { status: 500 }
        );
    }
}

// DELETE - Delete role
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if role exists
        const roleDoc = await adminFirestore.collection('roles').doc(id).get();
        if (!roleDoc.exists) {
            return NextResponse.json(
                { error: 'Role not found' },
                { status: 404 }
            );
        }

        const roleData = roleDoc.data();

        // Prevent deleting system roles
        if (roleData?.isSystem) {
            return NextResponse.json(
                { error: 'Cannot delete system roles' },
                { status: 403 }
            );
        }

        // Check if role is assigned to any users
        const usersWithRole = await adminFirestore
            .collection('users')
            .where('roles', 'array-contains', roleData?.name)
            .get();

        if (!usersWithRole.empty) {
            return NextResponse.json(
                { error: 'Cannot delete role that is assigned to users' },
                { status: 400 }
            );
        }

        await adminFirestore.collection('roles').doc(id).delete();

        return NextResponse.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        return NextResponse.json(
            { error: 'Failed to delete role' },
            { status: 500 }
        );
    }
}

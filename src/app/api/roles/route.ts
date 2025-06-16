import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { Role, NewRole } from '@/lib/types';

// GET - Fetch all roles
export async function GET() {
    try {
        const rolesSnapshot = await adminFirestore
            .collection('roles')
            .orderBy('name')
            .get();

        const roles: Role[] = rolesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Role));

        return NextResponse.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}

// POST - Create new role
export async function POST(request: NextRequest) {
    try {
        const roleData: NewRole = await request.json();

        // Check if role name already exists
        const existingRole = await adminFirestore
            .collection('roles')
            .where('name', '==', roleData.name)
            .get();

        if (!existingRole.empty) {
            return NextResponse.json(
                { error: 'Role with this name already exists' },
                { status: 400 }
            );
        }

        const newRole = {
            name: roleData.name,
            description: roleData.description || '',
            permissions: roleData.permissions || [],
            isSystem: roleData.isSystem || false,
            createdAt: new Date().toISOString(),
        };

        const docRef = await adminFirestore.collection('roles').add(newRole);

        const createdRole: Role = {
            id: docRef.id,
            ...newRole,
        };

        return NextResponse.json(createdRole, { status: 201 });
    } catch (error) {
        console.error('Error creating role:', error);
        return NextResponse.json(
            { error: 'Failed to create role' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';

// POST - Initialize default system roles
export async function POST() {
    try {
        const defaultRoles = [
            {
                name: 'Super Admin',
                description: 'Full system access with all permissions',
                permissions: ['admin:all'],
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'Admin',
                description: 'Administrative access to most system features',
                permissions: [
                    'read:users', 'write:users', 'delete:users',
                    'read:roles', 'write:roles',
                    'read:teams', 'write:teams', 'delete:teams',
                    'read:players', 'write:players', 'delete:players',
                    'read:leagues', 'write:leagues', 'delete:leagues',
                    'read:matches', 'write:matches', 'delete:matches',
                    'read:venues', 'write:venues', 'delete:venues',
                    'read:referees', 'write:referees', 'delete:referees',
                    'read:news', 'write:news', 'delete:news',
                    'read:settings', 'write:settings',
                ],
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'Editor',
                description: 'Can edit content but not manage users or system settings',
                permissions: [
                    'read:teams', 'write:teams',
                    'read:players', 'write:players',
                    'read:leagues', 'write:leagues',
                    'read:matches', 'write:matches',
                    'read:venues', 'write:venues',
                    'read:referees', 'write:referees',
                    'read:news', 'write:news',
                ],
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'Viewer',
                description: 'Read-only access to most content',
                permissions: [
                    'read:teams',
                    'read:players',
                    'read:leagues',
                    'read:matches',
                    'read:venues',
                    'read:referees',
                    'read:news',
                ],
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'Team Manager',
                description: 'Can manage specific teams and their players',
                permissions: [
                    'read:teams', 'write:teams',
                    'read:players', 'write:players',
                    'read:leagues',
                    'read:matches',
                    'read:venues',
                ],
                isSystem: false,
                createdAt: new Date().toISOString(),
            },
        ];

        const batch = adminFirestore.batch();
        const rolesCollection = adminFirestore.collection('roles');

        // Check if roles already exist
        for (const role of defaultRoles) {
            const existingRole = await rolesCollection
                .where('name', '==', role.name)
                .get();

            if (existingRole.empty) {
                const newRoleRef = rolesCollection.doc();
                batch.set(newRoleRef, role);
            }
        }

        await batch.commit();

        return NextResponse.json({
            message: 'Default roles initialized successfully',
            rolesCreated: defaultRoles.length
        });
    } catch (error) {
        console.error('Error initializing default roles:', error);
        return NextResponse.json(
            { error: 'Failed to initialize default roles' },
            { status: 500 }
        );
    }
}

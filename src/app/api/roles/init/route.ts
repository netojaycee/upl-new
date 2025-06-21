import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';

// POST - Initialize default system roles
export async function POST() {
    try {
        const defaultRoles = [
            {
                name: 'admin',
                description: 'Full administrative access to all system features including teams, players, leagues, venues, referees, users, and carousel management',
                permissions: [
                    'read:news', 'write:news',
                    'read:carousel', 'write:carousel',
                    'read:teams', 'write:teams',
                    'read:players', 'write:players',
                    'read:matches', 'write:matches',
                    'read:stats', 'write:stats',
                    'read:referees', 'write:referees',
                    'read:venues', 'write:venues',
                    'read:leagues', 'write:leagues',
                    'read:league_players', 'write:league_players',
                    'read:league_teams', 'write:league_teams',
                    'read:users', 'write:users',
                    'read:notificationTokens', 'write:notificationTokens'
                ],
                firestoreRule: 'get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(["admin"])',
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'writer',
                description: 'Content writer role with permission to create and edit news articles and reports',
                permissions: [
                    'read:news', 'write:news',
                    'read:teams', 'read:players', 'read:matches', 'read:stats',
                    'read:referees', 'read:venues', 'read:leagues',
                    'read:notificationTokens'
                ],
                firestoreRule: 'get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(["writer"])',
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'matchCom',
                description: 'Match Commissioner role with permissions to manage matches, match statistics, and related data',
                permissions: [
                    'read:news',
                    'read:teams', 'read:players',
                    'read:matches', 'write:matches',
                    'read:stats', 'write:stats',
                    'read:referees', 'read:venues', 'read:leagues',
                    'read:notificationTokens', 'write:notificationTokens'
                ],
                firestoreRule: 'get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(["matchCom", "admin"])',
                isSystem: true,
                createdAt: new Date().toISOString(),
            },
            {
                name: 'viewer',
                description: 'Read-only access for viewing public content and authenticated content where allowed',
                permissions: [
                    'read:news',
                    'read:teams', 'read:matches', 'read:stats',
                    'read:referees', 'read:venues', 'read:leagues',
                    'read:notificationTokens'
                ],
                firestoreRule: 'request.auth.uid != null',
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
            rolesCreated: defaultRoles.length,
            roles: defaultRoles.map(r => ({
                name: r.name,
                description: r.description,
                permissions: r.permissions.length
            }))
        });
    } catch (error) {
        console.error('Error initializing default roles:', error);
        return NextResponse.json(
            { error: 'Failed to initialize default roles' },
            { status: 500 }
        );
    }
}

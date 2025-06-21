// Available roles based on Firebase Rules
export const AVAILABLE_ROLES = [
    'admin',
    'writer',
    'matchCom',
    'viewer'
] as const;

export type UserRole = typeof AVAILABLE_ROLES[number];

// Role descriptions and permissions based on Firebase Rules
export const ROLE_DEFINITIONS = {
    admin: {
        name: 'Admin',
        description: 'Full administrative access to all system features',
        color: 'bg-red-100 text-red-800 border-red-300',
        permissions: [
            'All system operations',
            'User management',
            'Content management',
            'System configuration'
        ]
    },
    writer: {
        name: 'Writer',
        description: 'Content writer with news and reports permissions',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        permissions: [
            'Create and edit news',
            'View all content',
            'Generate reports'
        ]
    },
    matchCom: {
        name: 'Match Commissioner',
        description: 'Manage matches and statistics',
        color: 'bg-green-100 text-green-800 border-green-300',
        permissions: [
            'Manage matches',
            'Update match statistics',
            'View all match data',
            'Manage notifications'
        ]
    },
    viewer: {
        name: 'Viewer',
        description: 'Read-only access to public content',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        permissions: [
            'View public content',
            'Access authenticated areas'
        ]
    }
} as const;

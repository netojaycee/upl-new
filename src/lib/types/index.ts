export interface Team {
    id: string;
    name: string;
    imageUrl: string | null;
    phoneNumber?: string;
    createdAt: string;
}


export interface NewTeam {
    name: string;
    imageUrl: string | null;
    phoneNumber?: string;
    createdAt: string;
}


export interface LoginCredentials {
    email: string;
    password: string;
}

export interface Player {
    id: string;
    name: string;
    phoneNumber: string | null;
    dateOfBirth: string;
    imageUrl: string | null;
    createdAt: string;
    teamId?: string;
    teamName?: string;
}

export interface NewPlayer {
    name: string;
    phoneNumber: string | null;
    dateOfBirth: string;
    teamId: string;
    imageUrl: string | null;
    createdAt: string;
    teamName?: string;

}
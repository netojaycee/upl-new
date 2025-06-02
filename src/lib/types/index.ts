export interface Team {
    id: string;
    name: string;
    imageUrl: string | null;
    phoneNumber?: string;
    createdAt: string;
    currentManager?: string | null;
    address?: string | null;
    played?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    gf?: number;
    ga?: number;
    gd?: number;
    points?: number;
    position?: number;
    yearEstablished?: string | null;
}


export interface NewTeam {
    name: string;
    imageUrl: string | null;
    phoneNumber?: string;
    createdAt: string;
}

export interface League {
    id: string; // e.g., "Unity Premier League (2021) Season"
    competition: string; // e.g., "Unity Premier League"
    hasFinished: boolean; // e.g., false
    number: string; // e.g., 1 (auto-generated in Firestore)
    year: string; // e.g., "2021" or "2021/2022"
    // uid: string; // User ID for filtering
}

export interface NewLeague {
    competition: string;
    hasFinished: boolean;
    year: string; // Generated as "YYYY" or "YYYY/YYYY"
    id: string; // Generated as "${competition} (${year}) Season"
    // number: number;
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
    appearances: number;
    assists: number;
    currentLeague: string; // e.g., "Unity Premier League (2021) Season"
    goals: number;
    leagueId: string; // e.g., "041WqzXXlILIPEmB4Nu1"
    licenseNo: string | null; // e.g., "123456789"
    reds: number;
    teamId: string; // e.g., "Ace6J6tGi8IB90KL8VAx"
    teamName: string; // e.g., "Star Rovers FC"
    yellows: number;



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
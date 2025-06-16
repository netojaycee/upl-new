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

export enum MatchStatus {
    PLAYED = 'played',
    NOT_PLAYED = 'not played',
    LIVE = 'live',
    HALF_TIME = 'half-time'
}

export interface Match {
    id: string;
    homeTeam: string;
    homeTeamId: string;
    homeTeamImageUrl: string;
    homeScore: number;
    awayTeam: string;
    awayTeamId: string;
    awayTeamImageUrl: string;
    awayScore: number;
    competition: string;
    leagueId: string;
    date: string | Date;
    matchNo: number;
    venue: string;
    referee: string;
    report: string | null;
    status: MatchStatus;
}

export interface NewMatch {
    homeTeamId: string;
    awayTeamId: string;
    competition: string;
    leagueId: string;
    date: string | Date;
    matchNo: number;
    venue: string;
    referee: string;
    status: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    report?: string | null;
}

export interface BulkMatchUpload {
    matches: NewMatch[];
    leagueId: string;
}

export interface Venue {
    id: string;
    name: string;
    createdAt: string;
}

export interface NewVenue {
    name: string;
    createdAt: string;
}

export interface Referee {
    id: string;
    name: string;
    createdAt: string;
}

export interface NewReferee {
    name: string;
    createdAt: string;
}

export interface Carousel {
    id: string;
    imgUrl: string;
    message: string;
    createdAt: string;
}

export interface NewCarousel {
    imgUrl: string;
    message: string;
    createdAt: string;
}

export interface Settings {
    id: string;
    email: string;
    phone: string;
}

export interface UpdateSettings {
    email: string;
    phone: string;
}

export interface News {
    id: string;
    title: string;
    body: string;
    imgUrl: string;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    author: string;
    tags: string[];
}

export interface NewNews {
    title: string;
    body: string;
    imgUrl: string;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    author: string;
    tags: string[];
    imageFile?: File;
}

export enum StatType {
    YELLOW = 'yellow',
    SECOND_YELLOW = 'second yellow',
    RED = 'red',
    GOAL = 'goal',
    PENALTY_GOAL = 'penalty goal',
    OWN_GOAL = 'own goal',
    CANCELLED_GOAL = 'cancelled goal',
    MISSED_PENALTY = 'missed penalty'
}

export interface MatchStat {
    id: string;
    matchId: string;
    matchTitle: string;
    leagueId: string;
    playerId: string;
    name: string;
    playerImageUrl: string;
    teamId: string;
    teamName: string;
    type: StatType;
    minute: string;
    home: boolean;
}

export interface NewMatchStat {
    matchId: string;
    matchTitle: string;
    leagueId: string;
    playerId: string;
    name: string;
    playerImageUrl: string;
    teamId: string;
    teamName: string;
    type: StatType;
    minute: string;
    home: boolean;
}

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    disabled: boolean;
    emailVerified: boolean;
    roles: string[];
    createdAt: string;
    lastSignInTime?: string;
    customClaims?: Record<string, any>;
}

export interface NewUser {
    email: string;
    password: string;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    roles: string[];
    emailVerified?: boolean;
    disabled?: boolean;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    createdAt: string;
    isSystem: boolean; // Whether it's a system role that cannot be deleted
}

export interface NewRole {
    name: string;
    description?: string;
    permissions: string[];
    isSystem?: boolean;
}

export interface UserUpdate {
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    disabled?: boolean;
    emailVerified?: boolean;
    roles?: string[];
    customClaims?: Record<string, any>;
}
"use client";
import {
    useMutation,
    UseMutationResult,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"; // Add this import
import { auth, db } from "./firebase"; // Import auth from firebase.ts
import { User } from "firebase/auth";
import { League, LoginCredentials, NewLeague, NewPlayer, NewTeam, Player, Team, Match, MatchStatus, NewMatch, BulkMatchUpload, Venue, NewVenue, Referee, NewReferee, Carousel, NewCarousel, Settings, News, NewNews } from "./types";
import useAuthStore from "./store";
import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    DocumentData,
    CollectionReference,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { capitalizeWords } from "./utils";



export const useLogin = (): UseMutationResult<
    void,
    Error,
    LoginCredentials,
    unknown
> => {
    return useMutation({
        mutationFn: async ({ email, password }: LoginCredentials) => {
            await signInWithEmailAndPassword(auth, email, password);
        },
        // onSuccess and onError will be handled in the component with toast
    });
};


const fetchUser = (): Promise<User | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                resolve(user);
                unsubscribe(); // unsubscribe after first call
            },
            (error) => reject(error)
        );
    });
};

export const useUser = () => {
    return useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
        // optional: set stale time, refetch interval etc.
    });
};

// Mutation to handle logout
export const useLogout = () => {
    return useMutation({
        mutationFn: () => signOut(auth),
    });
};

export const useAddTeam = (): UseMutationResult<Team, Error, NewTeam, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (newTeam: NewTeam & { logoFile?: File }) => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(
                db,
                `teams`
            );

            let imageUrl = newTeam.imageUrl;
            if (newTeam.logoFile) {
                const teamId = doc(collRef).id; // Generate ID early for storage path
                const storageRef = ref(storage, `teamLogos/${teamId}.jpg`); // Ensure no conflict with 'ref'
                await uploadBytes(storageRef, newTeam.logoFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const teamData = {
                name: capitalizeWords(newTeam.name),
                phoneNumber: newTeam.phoneNumber,
                imageUrl,
                createdAt: newTeam.createdAt,
            };

            const docRef = await addDoc(collRef, teamData);
            return { id: docRef.id, ...teamData } as Team;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams", user?.uid] });
        },
    });
};

export const useUpdateTeam = (): UseMutationResult<
    Team,
    Error,
    { id: string } & NewTeam,
    unknown
> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (updatedTeam: { id: string } & NewTeam & { logoFile?: File }) => {
            if (!user) throw new Error("User not authenticated");
            const teamRef = doc(db, `teams`, updatedTeam.id);

            let imageUrl = updatedTeam.imageUrl;
            if (updatedTeam.logoFile) {
                const storageRef = ref(storage, `teamLogos/${updatedTeam.id}.jpg`);
                await uploadBytes(storageRef, updatedTeam.logoFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const teamData = {
                name: capitalizeWords(updatedTeam.name),
                phoneNumber: updatedTeam.phoneNumber,
                imageUrl,
                createdAt: updatedTeam.createdAt,
            };

            await updateDoc(teamRef, teamData);
            return { id: updatedTeam.id, ...teamData } as Team;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams", user?.uid] });
        },
    });
};

export const useGetTeam = (teamId: string | null): UseQueryResult<Team, Error> => {
    const { user } = useAuthStore();

    return useQuery<Team, Error>({
        queryKey: ["team", user?.uid, teamId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            if (!teamId) throw new Error("Team ID is required");
            const teamRef = doc(db, `teams`, teamId);
            const docSnap = await getDoc(teamRef);
            if (!docSnap.exists()) throw new Error("Team not found");
            return { id: docSnap.id, ...docSnap.data() } as Team;
        },
        enabled: !!user && !!teamId,
    });
};



export interface TeamsResult {
    teams: Team[];
    teamMap: Record<string, Team>;
}

export const useTeams = (): UseQueryResult<TeamsResult, Error> => {
    const { user } = useAuthStore();

    return useQuery<TeamsResult, Error>({
        queryKey: ["teams", user?.uid],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, `teams`);
            const q = query(collRef, orderBy("name", "asc"));
            const snapshot = await getDocs(q);
            const teams = snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as Team)
            );
            const teamMap = teams.reduce((map, team) => {
                map[team.id] = team;
                return map;
            }, {} as Record<string, Team>);
            return { teams, teamMap };
        },
        enabled: !!user,
    });
};




export const useDeleteTeam = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (teamId: string) => {
            if (!user) throw new Error("User not authenticated");
            const teamRef = doc(db, `teams`, teamId);
            const docSnap = await getDoc(teamRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.imageUrl) {
                    // Try to delete the image from storage
                    try {
                        const imageRef = ref(storage, `teamLogos/${teamId}.jpg`);
                        await deleteObject(imageRef);
                    } catch { /* ignore if not found */ }
                }
            }
            await deleteDoc(teamRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams", user?.uid] });
        },
    });
};

export const usePlayers = (): UseQueryResult<Player[], Error> => {
    const { user } = useAuthStore();

    return useQuery<Player[], Error>({
        queryKey: ["players", user?.uid],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(
                db,
                `players`
            );

            // Create query with orderBy for alphabetical sorting by name
            const q = query(collRef, orderBy("name", "asc"));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as Player)
            );
        },
        enabled: !!user,
    });
};

export const usePlayersByTeam = (teamId: string | null): UseQueryResult<Player[], Error> => {
    return useQuery<Player[], Error>({
        queryKey: ["players", "team"],
        queryFn: async () => {
            if (!teamId) throw new Error("Team ID is required");
            const collRef: CollectionReference<DocumentData> = collection(db, `players`);
            const q = query(collRef, where("teamId", "==", teamId), orderBy("name", "asc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as Player)
            );
        },
        enabled: !!teamId,
    });
};

export const useDeletePlayer = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (playerId: string) => {
            if (!user) throw new Error("User not authenticated");
            const playerRef = doc(db, `players`, playerId);
            const docSnap = await getDoc(playerRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.imageUrl) {
                    // Try to delete the image from storage
                    try {
                        const imageRef = ref(storage, `playerImages/${playerId}.jpg`);
                        await deleteObject(imageRef);
                    } catch { /* ignore if not found */ }
                }
            }
            await deleteDoc(playerRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["players", user?.uid] });
        },
    });
};

export const useAddPlayer = (): UseMutationResult<Player, Error, NewPlayer, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (newPlayer: NewPlayer & { imageFile?: File }) => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(
                db,
                `players`
            );

            let imageUrl = newPlayer.imageUrl;
            const playerId = doc(collRef).id; // Generate player ID early for image storage
            if (newPlayer.imageFile) {
                const storageRef = ref(storage, `playerImages/${playerId}.jpg`);
                await uploadBytes(storageRef, newPlayer.imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            // Fetch the team document to get the teamName
            let teamName = "";
            if (newPlayer.teamId) {
                const teamRef = doc(db, `teams`, newPlayer.teamId);
                const teamSnap = await getDoc(teamRef);
                if (teamSnap.exists()) {
                    teamName = teamSnap.data().name || ""; // Adjust 'name' to match your team document structure
                } else {
                    throw new Error("Team not found");
                }
            }

            const playerData = {
                name: capitalizeWords(newPlayer.name),
                phoneNumber: newPlayer.phoneNumber,
                dateOfBirth: newPlayer.dateOfBirth,
                teamId: newPlayer.teamId,
                teamName, // Include teamName in the player data
                imageUrl,
                createdAt: newPlayer.createdAt,
            };

            const docRef = await addDoc(collRef, playerData);
            return { id: docRef.id, ...playerData } as Player;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["players", user?.uid] });
            queryClient.invalidateQueries({
                queryKey: ["players", "team"],
            })
        },
    });
};

export const useUpdatePlayer = (): UseMutationResult<
    Player,
    Error,
    { id: string } & NewPlayer,
    unknown
> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (updatedPlayer: { id: string } & NewPlayer & { imageFile?: File }) => {
            if (!user) throw new Error("User not authenticated");
            const playerRef = doc(db, `players`, updatedPlayer.id);

            let imageUrl = updatedPlayer.imageUrl;
            if (updatedPlayer.imageFile) {
                const storageRef = ref(storage, `playerImages/${updatedPlayer.id}.jpg`);
                await uploadBytes(storageRef, updatedPlayer.imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            // Fetch the team document to get the teamName
            let teamName = "";
            if (updatedPlayer.teamId) {
                const teamRef = doc(db, `teams`, updatedPlayer.teamId);
                const teamSnap = await getDoc(teamRef);
                if (teamSnap.exists()) {
                    teamName = teamSnap.data().name || ""; // Adjust 'name' to match your team document structure
                } else {
                    throw new Error("Team not found");
                }
            }

            const playerData = {
                name: capitalizeWords(updatedPlayer.name),
                phoneNumber: updatedPlayer.phoneNumber,
                dateOfBirth: updatedPlayer.dateOfBirth,
                teamId: updatedPlayer.teamId,
                teamName, // Include teamName in the update
                imageUrl,
                createdAt: updatedPlayer.createdAt,
            };

            await updateDoc(playerRef, playerData);
            return { id: updatedPlayer.id, ...playerData } as Player;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["players", user?.uid] });

        },
    });
};


export const useGetPlayer = (playerId: string | null): UseQueryResult<Player, Error> => {
    const { user } = useAuthStore();

    return useQuery<Player, Error>({
        queryKey: ["player", playerId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            if (!playerId) throw new Error("Player ID is required");
            const playerRef = doc(db, `players`, playerId);
            const docSnap = await getDoc(playerRef);
            if (!docSnap.exists()) throw new Error("Player not found");
            return { id: docSnap.id, ...docSnap.data() } as Player;
        },
        enabled: !!user && !!playerId,
    });
};

export const useLeagues = (): UseQueryResult<League[], Error> => {
    const { user } = useAuthStore();

    return useQuery<League[], Error>({
        queryKey: ["leagues"],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "leagues");
            const q = query(collRef);
            const snapshot = await getDocs(q);

            const leagues = snapshot.docs.map(
                (doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    competition: capitalizeWords(doc.data().competition),
                } as League)
            );

            // Sort leagues case-insensitively by competition
            // return leagues.sort((a, b) =>
            //     a.competition.localeCompare(b.competition, undefined, { sensitivity: "base" })
            // );
            return leagues.sort((a, b) => Number(b.number) - Number(a.number));
        },
        enabled: !!user,
        refetchOnWindowFocus: false,
    });
};

export const useLeague = (leagueId: string): UseQueryResult<League, Error> => {
    const { user } = useAuthStore();

    return useQuery<League, Error>({
        queryKey: ["leagues", leagueId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            console.log("Fetching league with ID:", leagueId);
            const leagueRef = doc(db, "leagues", decodeURIComponent(leagueId));
            const docSnap = await getDoc(leagueRef);

            if (!docSnap.exists()) {
                throw new Error("League not found");
            }

            const leagueData = docSnap.data();
            console.log("League data:", leagueData);


            return {
                id: docSnap.id,
                ...leagueData,
                competition: capitalizeWords(leagueData.competition),
            } as League;
        },
        enabled: !!user && !!leagueId,
        refetchOnWindowFocus: false,
    });
};

export const useAddLeague = (): UseMutationResult<League, Error, NewLeague, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newLeague: NewLeague) => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "leagues");
            const q = query(collRef);
            const snapshot = await getDocs(q);
            const highestNumber = snapshot.empty
                ? 0
                : Math.max(...snapshot.docs.map((doc) => Number(doc.data().number) || 0));
            const newNumber = highestNumber + 1;

            const leagueData = {
                competition: newLeague.competition,
                hasFinished: newLeague.hasFinished,
                number: newNumber.toString(),
                year: newLeague.year,
                id: newLeague.id,
            };

            // Use setDoc to set the document with the provided id
            const leagueRef = doc(db, "leagues", newLeague.id);
            await setDoc(leagueRef, leagueData);

            return leagueData as League;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["leagues"] });
        },
    });
};

export const useUpdateLeague = (): UseMutationResult<League, Error, { number: string } & NewLeague, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();


    return useMutation({
        mutationFn: async (updatedLeague: { number: string } & NewLeague) => {
            if (!user) throw new Error("User not authenticated");
            const leagueRef = doc(db, "leagues", updatedLeague.id);

            const docSnap = await getDoc(leagueRef);

            if (!docSnap.exists()) {
                throw new Error("League not found");
            }



            const leagueData = {
                hasFinished: updatedLeague.hasFinished,

            };



            await updateDoc(leagueRef, leagueData);
            // return { ...leagueData } as League;
            return leagueData as League;

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["leagues"] });
        },
    });
};

export const useDeleteLeague = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (leagueId: string) => {
            if (!user) throw new Error("User not authenticated");
            // 1. Delete league document
            const leagueRef = doc(db, "leagues", leagueId);
            const docSnap = await getDoc(leagueRef);
            if (!docSnap.exists()) {
                throw new Error("League not found");
            }

            // 2. Delete all teams registered to this league in league_teams
            const leagueTeamsQ = query(
                collection(db, "league_teams"),
                where("currentLeague", "==", leagueId)
            );
            const leagueTeamsSnap = await getDocs(leagueTeamsQ);
            const leagueTeamDeletes = leagueTeamsSnap.docs.map(async (docSnap) => {
                await deleteDoc(doc(db, "league_teams", docSnap.id));
            });

            // 3. Delete all players registered to this league in league_players
            const leaguePlayersQ = query(
                collection(db, "league_players"),
                where("currentLeague", "==", leagueId)
            );
            const leaguePlayersSnap = await getDocs(leaguePlayersQ);
            const leaguePlayerDeletes = leaguePlayersSnap.docs.map(async (docSnap) => {
                await deleteDoc(doc(db, "league_players", docSnap.id));
            });

            // 4. Delete the league document itself
            await Promise.all([...leagueTeamDeletes, ...leaguePlayerDeletes]);
            await deleteDoc(leagueRef);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["leagues"] });
        },
    });
};

// --- LEAGUE-TEAM RELATIONSHIP ---

// Get all teams registered in a league
export const useTeamsInLeague = (leagueId: string) => {
    return useQuery<Team[], Error>({
        queryKey: ["leagueTeams", leagueId],
        queryFn: async () => {
            if (!leagueId) return [];
            const q = query(
                collection(db, "league_teams"),
                where("currentLeague", "==", leagueId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));
        },
        enabled: !!leagueId,
    });
};

// Add one or more teams to a league
// Add teams to a league (league_teams)
// Add teams to a league (league_teams)
export const useAddTeamsToLeague = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ selectedTeams, leagueId }: { selectedTeams: Team[], leagueId: string }) => {
            const batch = selectedTeams.map(async (team) => {
                const leagueTeamRef = doc(collection(db, "league_teams"));
                await setDoc(leagueTeamRef, {
                    ...team,
                    address: team.address || "", // Ensure address is always set
                    currentManager: team.currentManager || 0, // Ensure currentManager is always set
                    leagueTeamId: leagueTeamRef.id, // Use the generated ID for the league team
                    draws: team.draws || 0, // Ensure draws is always set
                    ga: team.ga || 0, // Ensure ga (goals against) is always set
                    gd: team.gd || 0, // Ensure gd (goal difference) is always set
                    gf: team.gf || 0, // Ensure gf (goals for) is always set
                    losses: team.losses || 0, // Ensure losses is always set
                    name: team.name, // Use the team's name
                    played: team.played || 0, // Ensure played is always set
                    points: team.points || 0, // Ensure points is always set
                    position: team.position || 0, // Ensure position is always set
                    wins: team.wins || 0, // Ensure wins is always set
                    yearEstablished: team.yearEstablished || 0, // Ensure yearEstablished is always set
                    id: team.id,
                    currentLeague: leagueId, // Always set this to the league's id!
                });



            });
            await Promise.all(batch);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leagueTeams"] });
        },
    });
};

// Remove a team from a league
export const useRemoveTeamFromLeague = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, leagueId }: { id: string, leagueId: string }) => {
            const q = query(
                collection(db, "league_teams"),
                where("id", "==", id),
                where("currentLeague", "==", leagueId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error("League team not found");
            }

            // Delete the first matching document
            const leagueTeamRef = doc(db, "league_teams", snapshot.docs[0].id);
            const docSnap = await getDoc(leagueTeamRef);

            if (!docSnap.exists()) {
                throw new Error("League team not found");
            }

            await deleteDoc(leagueTeamRef);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["leagueTeams"] });
        },
    });
};

// --- TEAM-PLAYER RELATIONSHIP FOR LEAGUE ---
// Get all players registered to a team for a league
export const usePlayersInTeamForLeague = (leagueId: string, teamId: string) => {
    return useQuery<Player[], Error>({
        queryKey: ["leaguePlayers", leagueId, teamId],
        queryFn: async () => {
            if (!leagueId || !teamId) return [];
            const q = query(
                collection(db, "league_players"),
                where("currentLeague", "==", leagueId),
                where("teamId", "==", teamId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Player));
        },
        enabled: !!leagueId && !!teamId,
    });
};

// Add one or more players to a team for a league
export const useAddPlayersToTeamForLeague = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ selectedPlayers, leagueId, teamId }: { selectedPlayers: Player[], leagueId: string, teamId: string }) => {
            const batch = selectedPlayers.map(async (player) => {
                const leaguePlayerRef = doc(db, "league_players", `${leagueId}_${teamId}_${player.id}`);
                await setDoc(leaguePlayerRef, {
                    ...player,
                    id: player.id, // Use player's id
                    name: player.name, // Use player's name
                    imageUrl: player.imageUrl || "", // Ensure imageUrl is always set
                    licenseNo: player.licenseNo || null, // Ensure licenseNo is always set
                    appearances: player.appearances || 0, // Ensure appearances is always set
                    assists: player.assists || 0, // Ensure assists is always set
                    goals: player.goals || 0, // Ensure goals is always set
                    reds: player.reds || 0, // Ensure reds is always set
                    yellows: player.yellows || 0, // Ensure yellows is always set
                    leagueId: leaguePlayerRef.id,           // Use league's id
                    teamId,
                    teamName: player.teamName || "", // Use player's teamName
                    currentLeague: leagueId, // If you want to keep this field, it should be the id
                });

            });
            await Promise.all(batch);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leaguePlayers"] });
        },
    });
};



export const useRemovePlayerFromTeamForLeague = (): UseMutationResult<void, Error, { leagueId: string; teamId: string; playerId: string }, unknown> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ leagueId, teamId, playerId }) => {
            // Query for the specific player in this team and league
            const q = query(
                collection(db, "league_players"),
                where("currentLeague", "==", leagueId),
                where("teamId", "==", teamId),
                where("id", "==", playerId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error("League player record not found");
            }

            // There could be only one, but just in case, delete all matching docs
            const batchDeletes = snapshot.docs.map((docSnap) =>
                deleteDoc(doc(db, "league_players", docSnap.id))
            );
            await Promise.all(batchDeletes);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["leaguePlayers"] });
        },
    });
};

// Custom hook to fetch all players registered in a league (across all league teams)
export const useAllPlayersInLeague = (leagueId: string) => {
    return useQuery<Player[], Error>({
        queryKey: ["allLeaguePlayers", leagueId],
        queryFn: async () => {
            if (!leagueId) return [];
            const q = query(
                collection(db, "league_players"),
                where("currentLeague", "==", leagueId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Player));
        },
        enabled: !!leagueId,
    });
};

// --- MATCH QUERIES ---

// Get all matches for a league
export const useLeagueMatches = (leagueId: string) => {
    return useQuery<Match[], Error>({
        queryKey: ["matches", leagueId],
        queryFn: async () => {
            if (!leagueId) return [];
            const q = query(
                collection(db, "matches"),
                where("leagueId", "==", leagueId),
                orderBy("matchNo", "asc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
        },
        enabled: !!leagueId,
    });
};

// Get a single match by ID
export const useMatch = (matchId: string) => {
    return useQuery<Match, Error>({
        queryKey: ["match", matchId],
        queryFn: async () => {
            if (!matchId) throw new Error("Match ID is required");
            const matchRef = doc(db, "matches", matchId);
            const docSnap = await getDoc(matchRef);
            if (!docSnap.exists()) throw new Error("Match not found");
            return { id: docSnap.id, ...docSnap.data() } as Match;
        },
        enabled: !!matchId,
    });
};

// Add a new match
export const useAddMatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newMatch: NewMatch) => {
            // Get home team details
            const homeTeamRef = doc(db, "teams", newMatch.homeTeamId);
            const homeTeamSnap = await getDoc(homeTeamRef);
            if (!homeTeamSnap.exists()) throw new Error("Home team not found");

            // Get away team details
            const awayTeamRef = doc(db, "teams", newMatch.awayTeamId);
            const awayTeamSnap = await getDoc(awayTeamRef);
            if (!awayTeamSnap.exists()) throw new Error("Away team not found");

            const matchData = {
                homeTeam: homeTeamSnap.data().name,
                homeTeamId: newMatch.homeTeamId,
                homeTeamImageUrl: homeTeamSnap.data().imageUrl || "",
                homeScore: newMatch.homeScore || 0,
                awayTeam: awayTeamSnap.data().name,
                awayTeamId: newMatch.awayTeamId,
                awayTeamImageUrl: awayTeamSnap.data().imageUrl || "",
                awayScore: newMatch.awayScore || 0,
                competition: newMatch.competition,
                leagueId: newMatch.leagueId,
                date: newMatch.date,
                matchNo: newMatch.matchNo,
                venue: newMatch.venue,
                referee: newMatch.referee || "",
                report: newMatch.report || null,
                status: newMatch.status || MatchStatus.NOT_PLAYED,
            };

            const matchRef = await addDoc(collection(db, "matches"), matchData);

            return { id: matchRef.id, ...matchData } as Match;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["matches", variables.leagueId] });
        },
    });
};

// Update an existing match
export const useUpdateMatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updatedMatch: Partial<Match> & { id: string }) => {
            const { id, ...matchData } = updatedMatch;
            const matchRef = doc(db, "matches", id);
            const docSnap = await getDoc(matchRef);

            if (!docSnap.exists()) throw new Error("Match not found");

            await updateDoc(matchRef, matchData);
            return updatedMatch as Match;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["matches", variables.leagueId] });
            queryClient.invalidateQueries({ queryKey: ["match", variables.id] });
        },
    });
};

// Delete a match
export const useDeleteMatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const matchRef = doc(db, "matches", id);
            const docSnap = await getDoc(matchRef);

            if (!docSnap.exists()) throw new Error("Match not found");

            await deleteDoc(matchRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};

// Bulk upload matches
export const useBulkAddMatches = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ matches, leagueId }: BulkMatchUpload) => {
            // Process each match
            const batch = matches.map(async (match) => {
                // Get home team details
                const homeTeamRef = doc(db, "teams", match.homeTeamId);
                const homeTeamSnap = await getDoc(homeTeamRef);
                if (!homeTeamSnap.exists()) throw new Error(`Home team not found: ${match.homeTeamId}`);

                // Get away team details
                const awayTeamRef = doc(db, "teams", match.awayTeamId);
                const awayTeamSnap = await getDoc(awayTeamRef);
                if (!awayTeamSnap.exists()) throw new Error(`Away team not found: ${match.awayTeamId}`);

                const matchData = {
                    homeTeam: homeTeamSnap.data().name,
                    homeTeamId: match.homeTeamId,
                    homeTeamImageUrl: homeTeamSnap.data().imageUrl || "",
                    homeScore: match.homeScore || 0,
                    awayTeam: awayTeamSnap.data().name,
                    awayTeamId: match.awayTeamId,
                    awayTeamImageUrl: awayTeamSnap.data().imageUrl || "",
                    awayScore: match.awayScore || 0,
                    competition: match.competition,
                    leagueId,
                    date: match.date,
                    matchNo: match.matchNo,
                    venue: match.venue,
                    referee: match.referee || "",
                    report: match.report || null,
                    status: match.status || MatchStatus.NOT_PLAYED,
                };

                await addDoc(collection(db, "matches"), matchData);
            });

            await Promise.all(batch);
            return { success: true, count: matches.length };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["matches", variables.leagueId] });
        },
    });
};

// --- VENUE QUERIES ---

export const useVenues = (): UseQueryResult<Venue[], Error> => {
    const { user } = useAuthStore();

    return useQuery<Venue[], Error>({
        queryKey: ["venues"],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "venues");
            const q = query(collRef, orderBy("name", "asc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as Venue)
            );
        },
        enabled: !!user,
    });
};

export const useAddVenue = (): UseMutationResult<Venue, Error, NewVenue, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newVenue: NewVenue) => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "venues");

            const venueData = {
                name: capitalizeWords(newVenue.name),
                createdAt: newVenue.createdAt,
            };

            const docRef = await addDoc(collRef, venueData);
            return { id: docRef.id, ...venueData } as Venue;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["venues"] });
        },
    });
};

export const useUpdateVenue = (): UseMutationResult<
    Venue,
    Error,
    { id: string } & NewVenue,
    unknown
> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedVenue: { id: string } & NewVenue) => {
            if (!user) throw new Error("User not authenticated");
            const venueRef = doc(db, "venues", updatedVenue.id);

            const venueData = {
                name: capitalizeWords(updatedVenue.name),
                createdAt: updatedVenue.createdAt,
            };

            await updateDoc(venueRef, venueData);
            return { id: updatedVenue.id, ...venueData } as Venue;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["venues"] });
        },
    });
};

export const useDeleteVenue = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (venueId: string) => {
            if (!user) throw new Error("User not authenticated");
            const venueRef = doc(db, "venues", venueId);
            await deleteDoc(venueRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["venues"] });
        },
    });
};

export const useVenue = (venueId: string | null): UseQueryResult<Venue, Error> => {
    const { user } = useAuthStore();

    return useQuery<Venue, Error>({
        queryKey: ["venue", venueId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            if (!venueId) throw new Error("Venue ID is required");
            const venueRef = doc(db, "venues", venueId);
            const docSnap = await getDoc(venueRef);
            if (!docSnap.exists()) throw new Error("Venue not found");
            return { id: docSnap.id, ...docSnap.data() } as Venue;
        },
        enabled: !!user && !!venueId,
    });
};

// --- REFEREE QUERIES ---

export const useReferees = (): UseQueryResult<Referee[], Error> => {
    const { user } = useAuthStore();

    return useQuery<Referee[], Error>({
        queryKey: ["referees"],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "referees");
            const q = query(collRef, orderBy("name", "asc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as Referee)
            );
        },
        enabled: !!user,
    });
};

export const useAddReferee = (): UseMutationResult<Referee, Error, NewReferee, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newReferee: NewReferee) => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "referees");

            const refereeData = {
                name: capitalizeWords(newReferee.name),
                createdAt: newReferee.createdAt,
            };

            const docRef = await addDoc(collRef, refereeData);
            return { id: docRef.id, ...refereeData } as Referee;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referees"] });
        },
    });
};

export const useUpdateReferee = (): UseMutationResult<
    Referee,
    Error,
    { id: string } & NewReferee,
    unknown
> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedReferee: { id: string } & NewReferee) => {
            if (!user) throw new Error("User not authenticated");
            const refereeRef = doc(db, "referees", updatedReferee.id);

            const refereeData = {
                name: capitalizeWords(updatedReferee.name),
                createdAt: updatedReferee.createdAt,
            };

            await updateDoc(refereeRef, refereeData);
            return { id: updatedReferee.id, ...refereeData } as Referee;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referees"] });
        },
    });
};

export const useDeleteReferee = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (refereeId: string) => {
            if (!user) throw new Error("User not authenticated");
            const refereeRef = doc(db, "referees", refereeId);
            await deleteDoc(refereeRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referees"] });
        },
    });
};

export const useReferee = (refereeId: string | null): UseQueryResult<Referee, Error> => {
    const { user } = useAuthStore();

    return useQuery<Referee, Error>({
        queryKey: ["referee", refereeId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            if (!refereeId) throw new Error("Referee ID is required");
            const refereeRef = doc(db, "referees", refereeId);
            const docSnap = await getDoc(refereeRef);
            if (!docSnap.exists()) throw new Error("Referee not found");
            return { id: docSnap.id, ...docSnap.data() } as Referee;
        },
        enabled: !!user && !!refereeId,
    });
};

// --- CAROUSEL QUERIES ---

export const useCarousels = (): UseQueryResult<Carousel[], Error> => {
    const { user } = useAuthStore();

    return useQuery<Carousel[], Error>({
        queryKey: ["carousels"],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "carousel");
            const snapshot = await getDocs(collRef);
            return snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as Carousel)
            );
        },
        enabled: !!user,
    });
};

export const useAddCarousel = (): UseMutationResult<Carousel, Error, NewCarousel & { imageFile?: File }, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (newCarousel: NewCarousel & { imageFile?: File }) => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "carousel");

            // Generate ID early for image storage
            const carouselId = doc(collRef).id;

            let imgUrl = newCarousel.imgUrl;
            if (newCarousel.imageFile) {
                const storageRef = ref(storage, `carousel/${carouselId}.jpg`);
                await uploadBytes(storageRef, newCarousel.imageFile);
                imgUrl = await getDownloadURL(storageRef);
            }

            const carouselData = {
                imgUrl,
                message: newCarousel.message,
                createdAt: newCarousel.createdAt,
            };

            await setDoc(doc(collRef, carouselId), carouselData);
            return { id: carouselId, ...carouselData } as Carousel;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carousels"] });
        },
    });
};

export const useUpdateCarousel = (): UseMutationResult<
    Carousel,
    Error,
    { id: string } & NewCarousel & { imageFile?: File },
    unknown
> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (updatedCarousel: { id: string } & NewCarousel & { imageFile?: File }) => {
            if (!user) throw new Error("User not authenticated");
            const carouselRef = doc(db, "carousel", updatedCarousel.id);

            let imgUrl = updatedCarousel.imgUrl;
            if (updatedCarousel.imageFile) {
                const storageRef = ref(storage, `carousel/${updatedCarousel.id}.jpg`);
                await uploadBytes(storageRef, updatedCarousel.imageFile);
                imgUrl = await getDownloadURL(storageRef);
            }

            const carouselData = {
                imgUrl,
                message: updatedCarousel.message,
                createdAt: updatedCarousel.createdAt,
            };

            await updateDoc(carouselRef, carouselData);
            return { id: updatedCarousel.id, ...carouselData } as Carousel;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carousels"] });
        },
    });
};

export const useDeleteCarousel = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (carouselId: string) => {
            if (!user) throw new Error("User not authenticated");

            // Delete image from storage
            try {
                const imageRef = ref(storage, `carousel/${carouselId}.jpg`);
                await deleteObject(imageRef);
            } catch (error) {
                console.log("No image to delete or error:", error);
            }

            // Delete document
            const carouselRef = doc(db, "carousel", carouselId);
            await deleteDoc(carouselRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carousels"] });
        },
    });
};

export const useCarousel = (carouselId: string | null): UseQueryResult<Carousel, Error> => {
    const { user } = useAuthStore();

    return useQuery<Carousel, Error>({
        queryKey: ["carousel", carouselId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            if (!carouselId) throw new Error("Carousel ID is required");
            const carouselRef = doc(db, "carousel", carouselId);
            const docSnap = await getDoc(carouselRef);
            if (!docSnap.exists()) throw new Error("Carousel item not found");
            return { id: docSnap.id, ...docSnap.data() } as Carousel;
        },
        enabled: !!user && !!carouselId,
    });
};

// --- SETTINGS QUERIES ---


export const useSettings = (settingId?: string) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ["settings", settingId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");

            if (settingId) {
                // Fetch a specific settings document
                const settingsRef = doc(db, "utils", settingId);
                const docSnap = await getDoc(settingsRef);
                if (!docSnap.exists()) throw new Error("Settings not found");
                return { id: docSnap.id, ...docSnap.data() } as Settings;
            } else {
                // Fetch all settings documents
                const collRef: CollectionReference<DocumentData> = collection(db, "utils");
                const snapshot = await getDocs(collRef);
                return snapshot.docs.map(
                    (doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    } as Settings)
                );
            }
        },
        enabled: !!user,
    });
};

export const useUpdateSettings = (): UseMutationResult<Settings, Error, Settings, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedSettings: Settings) => {
            if (!user) throw new Error("User not authenticated");
            const settingsRef = doc(db, "utils", updatedSettings.id);

            // Create a copy without the id field for Firestore
            const settingsData = {
                email: updatedSettings.email,
                phone: updatedSettings.phone,
                // Add any other fields here
            };

            await updateDoc(settingsRef, settingsData);
            return updatedSettings;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });
};

export const useDeleteSettings = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settingsId: string) => {
            if (!user) throw new Error("User not authenticated");
            const settingsRef = doc(db, "utils", settingsId);
            await deleteDoc(settingsRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });
};

// --- NEWS QUERIES ---

export const useNews = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ["news"],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            const collRef: CollectionReference<DocumentData> = collection(db, "news");
            const q = query(collRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(
                (doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as News)
            );
        },
        enabled: !!user,
    });
};

export const useNewsItem = (newsId: string | null) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ["news", newsId],
        queryFn: async () => {
            if (!user) throw new Error("User not authenticated");
            if (!newsId) throw new Error("News ID is required");
            const newsRef = doc(db, "news", newsId);
            const docSnap = await getDoc(newsRef);
            if (!docSnap.exists()) throw new Error("News item not found");
            return { id: docSnap.id, ...docSnap.data() } as News;
        },
        enabled: !!user && !!newsId,
    });
};

export const useAddNews = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (newNews: NewNews) => {
            if (!user) throw new Error("User not authenticated");

            // First, add the news document to get an ID
            const newsData = {
                title: newNews.title,
                body: newNews.body,
                imgUrl: newNews.imgUrl || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                uid: user.uid,
                authorId: user.uid,
                author: user.displayName || "Anonymous",
                tags: newNews.tags || [],
            };

            const docRef = await addDoc(collection(db, "news"), newsData);

            // If there's a file, upload it and update the document with the URL
            if (newNews.imageFile) {
                const storageRef = ref(storage, `news/${docRef.id}_${Date.now()}.jpg`);
                await uploadBytes(storageRef, newNews.imageFile);
                const imgUrl = await getDownloadURL(storageRef);

                // Update the document with the image URL
                await updateDoc(docRef, { imgUrl });
                newsData.imgUrl = imgUrl;
            }

            return { id: docRef.id, ...newsData } as News;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["news"] });
        },
    });
};

export const useUpdateNews = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (updatedNews: News & { imageFile?: File }) => {
            if (!user) throw new Error("User not authenticated");

            // Check ownership
            const newsRef = doc(db, "news", updatedNews.id);
            const docSnap = await getDoc(newsRef);
            if (!docSnap.exists()) throw new Error("News item not found");

            const currentData = docSnap.data();
            if (currentData.authorId !== user.uid) {
                throw new Error("You can only edit your own news items");
            }

            // Prepare update data
            const newsData: { 
                title: string; 
                body: string; 
                updatedAt: string; 
                tags: string[]; 
                imgUrl?: string 
            } = {
                title: updatedNews.title,
                body: updatedNews.body,
                updatedAt: new Date().toISOString(),
                tags: updatedNews.tags || [],
            };

            // If there's a new image file, upload it
            if (updatedNews.imageFile) {
                // Delete the old image if it exists
                if (updatedNews.imgUrl) {
                    try {
                        const oldImageRef = ref(storage, updatedNews.imgUrl);
                        await deleteObject(oldImageRef);
                    } catch (error) {
                        console.log("Error deleting old image:", error);
                    }
                }

                // Upload new image
                const storageRef = ref(storage, `news/${updatedNews.id}_${Date.now()}.jpg`);
                await uploadBytes(storageRef, updatedNews.imageFile);
                const imgUrl = await getDownloadURL(storageRef);
                newsData.imgUrl = imgUrl;
            }

            // Update the document
            await updateDoc(newsRef, newsData);

            // Return the updated news data
            return {
                ...updatedNews,
                ...newsData,
                imgUrl: newsData.imgUrl || updatedNews.imgUrl,
            };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["news"] });
            queryClient.invalidateQueries({ queryKey: ["news", data.id] });
        },
    });
};

export const useDeleteNews = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const storage = getStorage();

    return useMutation({
        mutationFn: async (newsId: string) => {
            if (!user) throw new Error("User not authenticated");

            // First, get the news document to check ownership and get image URL
            const newsRef = doc(db, "news", newsId);
            const docSnap = await getDoc(newsRef);

            if (!docSnap.exists()) throw new Error("News item not found");

            const newsData = docSnap.data();
            if (newsData.authorId !== user.uid) {
                throw new Error("You can only delete your own news items");
            }

            // Delete the image from storage if it exists
            if (newsData.imgUrl) {
                try {
                    const imageRef = ref(storage, newsData.imagUrl);
                    await deleteObject(imageRef);
                } catch (error) {
                    console.log("Error deleting image:", error);
                    // Continue with deletion of the document
                }
            }

            // Delete the news document
            await deleteDoc(newsRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["news"] });
        },
    });
};
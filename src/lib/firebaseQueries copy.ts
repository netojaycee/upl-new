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
import { League, LoginCredentials, NewLeague, NewPlayer, NewTeam, Player, Team } from "./types";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

    return useMutation({
        mutationFn: async (teamId: string) => {
            if (!user) throw new Error("User not authenticated");
            const teamRef = doc(db, `teams`, teamId);
            await deleteDoc(teamRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams", user?.uid] });
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

// export const useUpdatePlayer = (): UseMutationResult<
//     Player,
//     Error,
//     { id: string } & NewPlayer,
//     unknown
// > => {
//     const { user } = useAuthStore();
//     const queryClient = useQueryClient();
//     const storage = getStorage();

//     return useMutation({
//         mutationFn: async (updatedPlayer: { id: string } & NewPlayer & { imageFile?: File }) => {
//             if (!user) throw new Error("User not authenticated");
//             const playerRef = doc(db, `players`, updatedPlayer.id);

//             let imageUrl = updatedPlayer.imageUrl;
//             if (updatedPlayer.imageFile) {
//                 const storageRef = ref(storage, `playerImages/${updatedPlayer.id}.jpg`);
//                 await uploadBytes(storageRef, updatedPlayer.imageFile);
//                 imageUrl = await getDownloadURL(storageRef);
//             }

//             const playerData = {
//                 name: updatedPlayer.name,
//                 phoneNumber: updatedPlayer.phoneNumber,
//                 dateOfBirth: updatedPlayer.dateOfBirth,
//                 teamId: updatedPlayer.teamId,
//                 imageUrl,
//                 createdAt: updatedPlayer.createdAt,
//             };

//             await updateDoc(playerRef, playerData);
//             return { id: updatedPlayer.id, ...playerData } as Player;
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["players", user?.uid] });
//         },
//     });
// };


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

export const useDeletePlayer = (): UseMutationResult<void, Error, string, unknown> => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playerId: string) => {
            if (!user) throw new Error("User not authenticated");
            const playerRef = doc(db, `players`, playerId);
            await deleteDoc(playerRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["players", user?.uid] });
        },
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


            // const formattedCompetition = capitalizeWords(updatedLeague.competition);
            // const generatedId = `${formattedCompetition} (${updatedLeague.year}) Season`;

            const leagueData = {
                // competition: updatedLeague.competition,
                hasFinished: updatedLeague.hasFinished,
                // number: updatedLeague.number,
                // year: updatedLeague.year,
                // uid: user.uid,
                // id: updatedLeague.id,
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
            const leagueRef = doc(db, "leagues", leagueId);
            const docSnap = await getDoc(leagueRef);

            if (!docSnap.exists()) {
                throw new Error("League not found");
            }


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
                    yearEstablished: team.yearEstablished || "", // Ensure yearEstablished is always set
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

// Remove a player from a team for a league
// export const useRemovePlayerFromTeamForLeague = (): UseMutationResult<void, Error, { leagueId: string; teamId: string; playerId: string }, unknown> => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async ({ leagueId, teamId, playerId }: { leagueId: string; teamId: string; playerId: string }) => {
//             const leaguePlayerRef = doc(db, "league_players", `${leagueId}_${teamId}_${playerId}`);
//             const docSnap = await getDoc(leaguePlayerRef);

//             if (!docSnap.exists()) {
//                 throw new Error("League player record not found");
//             }

//             await deleteDoc(leaguePlayerRef);
//         },
//         onSuccess: async (_, { leagueId, teamId }) => {
//             await queryClient.invalidateQueries({ queryKey: ["leaguePlayers", leagueId, teamId] });
//         },
//     });
// };

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
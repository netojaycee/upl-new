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
import { LoginCredentials, NewPlayer, NewTeam, Player, Team } from "./types";
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
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


// New login hook


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
                name: newTeam.name,
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
                name: updatedTeam.name,
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
                name: newPlayer.name,
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
                name: updatedPlayer.name,
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
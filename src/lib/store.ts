"use client"; // Client-side only

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

// Define user shape
interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

// Define store state and actions
interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    setUser: (user: AuthUser) => void;
    clearUser: () => void;
}

// Type persist middleware
const useAuthStore = create<AuthState>()(
    persist<AuthState>(
        (set) => ({
            user: null,
            isLoading: true,
            setUser: (user: AuthUser) => set({ user, isLoading: false }),
            clearUser: () => set({ user: null, isLoading: false }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Sync with Firebase Auth and redirect on login
onAuthStateChanged(auth, (firebaseUser: User | null) => {
    const { setUser } = useAuthStore.getState();
    if (firebaseUser) {
        setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
        });
        // Redirect to dashboard on successful login, aligning with your HTML example
        // window.location.href = "/dashboard";
    } else {
        // clearUser();
        // console.log(window.location.pathname);
        // Optional: Redirect to login if not authenticated (uncomment if desired)
        // if (window.location.pathname !== "/") {
        //     window.location.href = "/";
        // }
    }
});

export default useAuthStore;
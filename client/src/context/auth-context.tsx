import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { storageService } from "@/lib/storage";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    isConfigured: boolean;
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                try {
                    // Trigger migration if needed when user logs in
                    await storageService.initializeData();
                } catch (e) {
                    console.error("Data initialization/migration failed:", e);
                }
                // Invalidate queries so UI refreshes with cloud data
                queryClient.invalidateQueries();
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!auth) {
            throw new Error("Firebase Authentication is not configured. Please set Firebase environment variables.");
        }
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string, name?: string) => {
        if (!auth) {
            throw new Error("Firebase Authentication is not configured. Please set Firebase environment variables.");
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (name && userCredential.user) {
                await updateProfile(userCredential.user, { displayName: name });
                setUser({ ...userCredential.user, displayName: name });
            }
        } catch (error) {
            console.error("Error signing up with email", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        if (!auth) {
            throw new Error("Firebase Authentication is not configured. Please set Firebase environment variables.");
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with email", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (auth) {
                await signOut(auth);
            }
            setUser(null);
            queryClient.invalidateQueries();
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    };

    const continueAsGuest = () => {
        setLocation("/");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isGuest: !user,
                isConfigured: isFirebaseConfigured,
                signInWithGoogle,
                signUpWithEmail,
                signInWithEmail,
                logout,
                continueAsGuest
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

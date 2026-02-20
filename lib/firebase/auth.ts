import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { User } from "@/types/user";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // First-time user: create document
            const newUser = {
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || "",
                photoURL: user.photoURL,
                role: "runner",
                phone: "",
                address: {
                    street: "",
                    city: "",
                    province: "",
                    zipCode: "",
                    country: "Philippines",
                },
                emergencyContact: {
                    name: "",
                    phone: "",
                    relationship: "",
                },
                medicalConditions: "",
                tShirtSize: "",
                singletSize: "",
                profileCompletion: 15, // Basic info from Google (email/name)
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(userDocRef, newUser);
            return { user, isNewUser: true };
        }

        return { user, isNewUser: false };
    } catch (error) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);

        // Clear session cookie
        await fetch("/api/auth/session", { method: "DELETE" });
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

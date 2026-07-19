/// <reference types="vite/client" />
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Firestore } from "firebase/firestore";

// User-provided Firebase credentials & potential env variables fallback
const fallbackConfig = {
  apiKey: "AIzaSyCD8pt0xE3WaWate8A0sXukOIZ7lolfl30",
  authDomain: "gmao-sthic.firebaseapp.com",
  projectId: "gmao-sthic",
  storageBucket: "gmao-sthic.firebasestorage.app",
  messagingSenderId: "61792499399",
  appId: "1:61792499399:web:b7860dd25d486525a070e2"
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId
};

const hasKeys = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;
let dbFirestore: Firestore | null = null;
let isRealFirebase = false;

const forceSandbox = localStorage.getItem("sthic_force_sandbox") === "true";

if (hasKeys && !forceSandbox) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    dbFirestore = getFirestore(app);
    isRealFirebase = true;
    console.log("🔥 Firebase Client Auth & Firestore initialized successfully with project: " + firebaseConfig.projectId);
  } catch (error) {
    console.error("⚠️ Failed to initialize real Firebase client:", error);
  }
} else {
  if (forceSandbox) {
    console.log("ℹ️ Sandbox mode manually forced by user.");
  } else {
    console.log("ℹ️ Firebase credentials missing. Operating in high-fidelity sandbox/simulation mode.");
  }
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isSimulated?: boolean;
}

// Local mock database of simulated users to allow seamless testing in sandbox
const SIMULATED_USERS_KEY = "sthic_simulated_users";
const SIMULATED_ACTIVE_USER_KEY = "sthic_simulated_active_user";

const simulatedListeners = new Set<(user: UserProfile | null) => void>();

const notifySimulatedListeners = () => {
  const raw = localStorage.getItem(SIMULATED_ACTIVE_USER_KEY);
  let user: UserProfile | null = null;
  if (raw) {
    try {
      user = JSON.parse(raw);
    } catch {
      user = null;
    }
  }
  simulatedListeners.forEach((listener) => listener(user));
};

const getSimulatedUsers = (): Record<string, { email: string; password?: string; name: string }> => {
  try {
    const raw = localStorage.getItem(SIMULATED_USERS_KEY);
    return raw ? JSON.parse(raw) : {
      "admin@sthic.cg": { email: "admin@sthic.cg", password: "password", name: "Superviseur STHIC" }
    };
  } catch {
    return {};
  }
};

const saveSimulatedUsers = (users: Record<string, { email: string; password?: string; name: string }>) => {
  localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(users));
};

/**
 * Robust authentication interface that wraps around Firebase Auth & provides an elegant Sandbox fallback
 */
export const AuthManager = {
  isRealFirebase: () => isRealFirebase,

  isSandboxForced: () => forceSandbox,

  setForceSandbox: (val: boolean) => {
    localStorage.setItem("sthic_force_sandbox", val ? "true" : "false");
    window.location.reload();
  },

  /**
   * Monitor auth state changes
   */
  subscribe: (callback: (user: UserProfile | null) => void) => {
    if (isRealFirebase && auth) {
      return onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          callback({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            isSimulated: false
          });
        } else {
          callback(null);
        }
      });
    } else {
      // Sandbox fallback - check local storage
      simulatedListeners.add(callback);

      const raw = localStorage.getItem(SIMULATED_ACTIVE_USER_KEY);
      if (raw) {
        try {
          callback(JSON.parse(raw));
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }

      // Listen for local changes from other tabs as well
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === SIMULATED_ACTIVE_USER_KEY) {
          const rawVal = e.newValue;
          if (rawVal) {
            try {
              callback(JSON.parse(rawVal));
            } catch {
              callback(null);
            }
          } else {
            callback(null);
          }
        }
      };
      window.addEventListener("storage", handleStorageChange);

      // Return unsubscribe
      return () => {
        simulatedListeners.delete(callback);
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  },

  /**
   * Sign up with Email and Password
   */
  signUpWithEmail: async (email: string, pass: string, fullName: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      throw new Error("L'email et le mot de passe sont obligatoires.");
    }
    if (pass.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
    }

    if (isRealFirebase && auth) {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      // We simulate displayName update via custom profiles if needed, or return directly
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: fullName || cleanEmail.split("@")[0],
        photoURL: null,
        isSimulated: false
      };
    } else {
      // Simulate sign up
      const users = getSimulatedUsers();
      if (users[cleanEmail]) {
        throw new Error("Cet utilisateur existe déjà.");
      }
      users[cleanEmail] = { email: cleanEmail, password: pass, name: fullName };
      saveSimulatedUsers(users);

      const mockUser: UserProfile = {
        uid: `sim-${Math.floor(Math.random() * 1000000)}`,
        email: cleanEmail,
        displayName: fullName,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        isSimulated: true
      };

      localStorage.setItem(SIMULATED_ACTIVE_USER_KEY, JSON.stringify(mockUser));
      notifySimulatedListeners();
      return mockUser;
    }
  },

  /**
   * Login with Email and Password
   */
  signInWithEmail: async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      throw new Error("L'email et le mot de passe sont requis.");
    }

    if (isRealFirebase && auth) {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cleanEmail.split("@")[0],
        photoURL: cred.user.photoURL,
        isSimulated: false
      };
    } else {
      // Simulate login
      const users = getSimulatedUsers();
      const match = users[cleanEmail];
      if (!match || match.password !== pass) {
        throw new Error("Identifiants incorrects (Email ou Mot de passe invalide).");
      }

      const mockUser: UserProfile = {
        uid: `sim-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "")}`,
        email: cleanEmail,
        displayName: match.name,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name)}`,
        isSimulated: true
      };

      localStorage.setItem(SIMULATED_ACTIVE_USER_KEY, JSON.stringify(mockUser));
      notifySimulatedListeners();
      return mockUser;
    }
  },

  /**
   * Google Sign-In (Gmail)
   */
  signInWithGoogle: async (): Promise<UserProfile> => {
    if (isRealFirebase && auth && provider) {
      try {
        const cred = await signInWithPopup(auth, provider);
        return {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          isSimulated: false
        };
      } catch (err: any) {
        console.error("Google login popup failed/blocked.", err);
        const code = err?.code || "";
        const message = err?.message || "";
        if (code === "auth/unauthorized-domain" || message.includes("unauthorized-domain")) {
          throw new Error(`[ERR_UNAUTHORIZED_DOMAIN]`);
        }
        throw new Error(err.message || "Le pop-up de connexion Google a été bloqué ou fermé.");
      }
    } else {
      // High fidelity simulation of Gmail auth inside preview
      // Prompt for a mock gmail account or pick a pre-selected one
      const promptEmail = prompt(
        "Simulation de connexion Google Gmail\nVeuillez saisir votre adresse e-mail Google :",
        "technicien@gmail.com"
      );

      if (promptEmail === null) {
        throw new Error("Connexion Google annulée.");
      }

      const cleanEmail = promptEmail.trim().toLowerCase();
      if (!cleanEmail.includes("@")) {
        throw new Error("Adresse e-mail invalide.");
      }

      const defaultName = cleanEmail.split("@")[0].toUpperCase().replace(".", " ");
      const mockUser: UserProfile = {
        uid: `google-sim-${Math.floor(Math.random() * 100000)}`,
        email: cleanEmail,
        displayName: defaultName,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultName)}`,
        isSimulated: true
      };

      localStorage.setItem(SIMULATED_ACTIVE_USER_KEY, JSON.stringify(mockUser));
      notifySimulatedListeners();
      return mockUser;
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    if (isRealFirebase && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem(SIMULATED_ACTIVE_USER_KEY);
      notifySimulatedListeners();
    }
  }
};

/**
 * CloudManager provides real Firebase Firestore synchronization with high-fidelity local sandbox simulation backup
 */
export const CloudManager = {
  saveToCloud: async (userId: string, data: any): Promise<void> => {
    if (isRealFirebase && dbFirestore) {
      const userDocRef = doc(dbFirestore, "users_gmao_db", userId);
      await setDoc(userDocRef, {
        data: JSON.stringify(data),
        updatedAt: new Date().toISOString()
      });
    } else {
      // High fidelity sandbox simulation
      localStorage.setItem(`sthic_simulated_cloud_db_${userId}`, JSON.stringify({
        data: JSON.stringify(data),
        updatedAt: new Date().toISOString()
      }));
      // Wait a tiny bit to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  },

  loadFromCloud: async (userId: string): Promise<any | null> => {
    if (isRealFirebase && dbFirestore) {
      const userDocRef = doc(dbFirestore, "users_gmao_db", userId);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const payload = snap.data();
        if (payload?.data) {
          return JSON.parse(payload.data);
        }
      }
      return null;
    } else {
      // High fidelity sandbox simulation
      const raw = localStorage.getItem(`sthic_simulated_cloud_db_${userId}`);
      await new Promise(resolve => setTimeout(resolve, 800));
      if (raw) {
        try {
          const payload = JSON.parse(raw);
          if (payload?.data) {
            return JSON.parse(payload.data);
          }
        } catch {
          return null;
        }
      }
      return null;
    }
  }
};

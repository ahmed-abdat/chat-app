import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          lastSeen: serverTimestamp(),
          online: true
        }, { merge: true });

        // Set up presence system
        const presenceRef = doc(db, 'presence', user.uid);
        await setDoc(presenceRef, { online: true, lastSeen: serverTimestamp() });

        // Set up offline trigger
        window.addEventListener('beforeunload', async () => {
          await setDoc(presenceRef, { online: false, lastSeen: serverTimestamp() });
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() });
          } else {
            // If doc doesn't exist, we wait for the login function to create it 
            // or we create a default one here if it was a direct login (e.g. page refresh)
            const role = firebaseUser.email === 'prasannashiremath27@gmail.com' ? 'admin' : 'customer';
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: role,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (err) {
          console.error("Auth Hook Error:", err);
          setError(err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (forcedRole?: 'admin' | 'customer' | 'delivery_boy') => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    let finalUser: any;
    if (!userDoc.exists()) {
      const role = forcedRole || (firebaseUser.email === 'prasannashiremath27@gmail.com' ? 'admin' : 'customer');
      finalUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, finalUser);
    } else {
      const existingData = userDoc.data();
      if (forcedRole && existingData.role !== forcedRole) {
        await updateDoc(userDocRef, { 
          role: forcedRole,
          updatedAt: new Date().toISOString()
        });
        finalUser = { ...existingData, role: forcedRole };
      } else {
        finalUser = { id: userDoc.id, ...existingData };
      }
    }
    setUser(finalUser);
    return finalUser;
  };

  const logout = () => auth.signOut();

  return { user, loading, error, login, logout };
}

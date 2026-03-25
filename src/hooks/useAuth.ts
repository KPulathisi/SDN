import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';

export const useAuth = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role,
              rdcId: userData.rdcId,
              phone: userData.phone,
              address: userData.address,
              createdAt: userData.createdAt.toDate(),
            });
          } else {
            // Create demo user data if it doesn't exist
            const demoUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.email?.includes('admin') ? 'Admin User' : 'Demo Customer',
              role: firebaseUser.email?.includes('admin') ? 'head_office' : 'retail_customer',
              phone: '+1234567890',
              address: '123 Demo Street, Demo City, DC 12345',
              createdAt: new Date(),
            };
            setUser(demoUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
};
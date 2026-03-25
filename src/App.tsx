import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserRole } from './types';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Deliveries from './pages/Deliveries';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Settings from './pages/Settings';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/auth';

function App() {
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch additional user profile data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || 'User',
              role: (userData.role as UserRole) || 'retail_customer',
              rdcId: userData.rdcId,
            });
          } else {
            // Fallback for new users without a profile doc yet
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: 'retail_customer',
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="inventory" element={
            <ProtectedRoute roles={['head_office', 'rdc_staff']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="deliveries" element={
            <ProtectedRoute roles={['logistics', 'head_office', 'rdc_staff', 'retail_customer']}>
              <Deliveries />
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute roles={['retail_customer', 'head_office', 'rdc_staff']}>
              <Payments />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute roles={['head_office']}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute roles={['head_office']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
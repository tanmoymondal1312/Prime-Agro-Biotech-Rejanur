import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import { FirebaseProvider } from './pro2/lib/FirebaseContext';

// Eagerly imported — eliminates the lazy-load spinner on first navigation
import Pro1App from './pro1/App';
import Pro2App from './pro2/App';
import Pro3App from './pro3/App';

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  return <>{element}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/home"
          element={<ProtectedRoute element={<HomePage />} />}
        />

        {/* Pro1 — সমন্বিত কৃষি ট্রেড */}
        <Route path="/krishi/*"
          element={
            <ProtectedRoute element={
              <div className="app-pro1-wrapper"><Pro1App /></div>
            } />
          }
        />

        {/* Pro2 — দেনা পাওনার হিসাব */}
        <Route path="/hisab/*"
          element={
            <ProtectedRoute element={
              <FirebaseProvider>
                <div className="app-pro2-wrapper"><Pro2App /></div>
              </FirebaseProvider>
            } />
          }
        />

        {/* Pro3 — রেজার খামার */}
        <Route path="/khamar/*"
          element={
            <ProtectedRoute element={
              <div className="app-pro3-wrapper overflow-x-hidden"><Pro3App /></div>
            } />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Sent from './pages/Sent';
import Compose from './pages/Compose';
import AIDashboard from './pages/AIDashboard';
import Settings from './pages/Settings';
import EmailManagement from './pages/EmailManagement';
import Users from './pages/Users';
import Roles from './pages/Roles';
import SESConfiguration from './pages/SESConfiguration';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: '',
            style: {
              background: '#1a1a1a',
              color: '#e5e5e5',
              border: '1px solid #2a2a2a',
            },
            success: {
              iconTheme: {
                primary: '#ff7e52',
                secondary: '#1a1a1a',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/sent"
            element={
              <ProtectedRoute>
                <Sent />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/compose"
            element={
              <ProtectedRoute>
                <Compose />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ai-dashboard"
            element={
              <ProtectedRoute>
                <AIDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/emails"
            element={
              <ProtectedRoute>
                <EmailManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ses-config"
            element={
              <ProtectedRoute>
                <SESConfiguration />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './stores/authStore';
import { Toaster } from 'react-hot-toast';
import Loading from './components/Loading';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';


export default function App() {

  const { getMe,isAuthenticated, isAuthChecked } = useAuthStore();

  useEffect(() => {
    getMe();
  }, [getMe]);

  if (!isAuthChecked) {
    return <Loading />;
  }

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={ isAuthenticated ? <HomePage /> : <LandingPage />} />
        <Route path="/chat/:chatId" element={isAuthenticated ? <HomePage /> : <Navigate to="/" />} />
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      </Routes>
    </Router>
  );
}

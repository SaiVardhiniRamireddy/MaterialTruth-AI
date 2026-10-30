import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analyze from './pages/Analyze.jsx';
import Results from './pages/Results.jsx';
import History from './pages/History.jsx';
import Knowledge from './pages/Knowledge.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';

const TITLES = {
  '/': 'MaterialTruth AI — Multimodal Material Identification & EcoImpact',
  '/login': 'Log in · MaterialTruth AI',
  '/register': 'Create account · MaterialTruth AI',
  '/dashboard': 'Dashboard · MaterialTruth AI',
  '/analyze': 'New analysis · MaterialTruth AI',
  '/history': 'Analysis history · MaterialTruth AI',
  '/materials': 'Material knowledge library · MaterialTruth AI',
  '/about': 'About · MaterialTruth AI',
};

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLES[pathname] || (pathname.startsWith('/results') ? 'Analysis report · MaterialTruth AI' : 'MaterialTruth AI');
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink-900 dark:bg-[#000000] dark:text-[#e5e5e5] transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/materials" element={<Knowledge />} />
          <Route path="/about" element={<About />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/history" element={<History />} />
          </Route>
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

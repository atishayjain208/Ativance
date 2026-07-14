import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Resume from './pages/Resume';
import GitHub from './pages/GitHub';
import DSA from './pages/DSA';
import Mentor from './pages/Mentor';
import Roadmap from './pages/Roadmap';
import Interview from './pages/Interview';

// ── Private route guard ───────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// ── Wrap page in Layout + PrivateRoute ────────────────────────────────────────
function Protected({ children }) {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected — all wrapped in Layout */}
        <Route path="/dashboard"  element={<Protected><Dashboard /></Protected>} />
        <Route path="/resume"     element={<Protected><Resume /></Protected>} />
        <Route path="/github"     element={<Protected><GitHub /></Protected>} />
        <Route path="/dsa"        element={<Protected><DSA /></Protected>} />
        <Route path="/mentor"     element={<Protected><Mentor /></Protected>} />
        <Route path="/roadmap"    element={<Protected><Roadmap /></Protected>} />
        <Route path="/interview"  element={<Protected><Interview /></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

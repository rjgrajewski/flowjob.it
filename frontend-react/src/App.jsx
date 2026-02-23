import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Onboarding from './pages/Onboarding.jsx';
import CVBuilder from './pages/CVBuilder.jsx';
import JobBoard from './pages/JobBoard.jsx';
import { auth } from './services/api.js';

function ProtectedRoute({ children }) {
    return auth.isAuthenticated() ? children : <Navigate to="/register" replace />;
}

// After login, new users that haven't completed onboarding are redirected to /onboarding
function OnboardingGate({ children }) {
    if (!auth.isAuthenticated()) return <Navigate to="/register" replace />;
    if (!auth.hasCompletedOnboarding()) return <Navigate to="/onboarding" replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 64px)' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                    <Route path="/cv" element={<OnboardingGate><CVBuilder /></OnboardingGate>} />
                    <Route path="/jobs" element={<OnboardingGate><JobBoard /></OnboardingGate>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

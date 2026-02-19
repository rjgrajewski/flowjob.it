import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import CVBuilder from './pages/CVBuilder.jsx';
import JobBoard from './pages/JobBoard.jsx';
import { auth } from './services/api.js';

function ProtectedRoute({ children }) {
    return auth.isAuthenticated() ? children : <Navigate to="/register" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 64px)' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cv" element={<ProtectedRoute><CVBuilder /></ProtectedRoute>} />
                    <Route path="/jobs" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

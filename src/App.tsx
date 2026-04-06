import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import HostEventPage from './pages/HostEventPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import AdminDashboard from './pages/AdminDashboard';
import TicketVerification from './pages/TicketVerification';
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<HomePage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/host" element={<HostEventPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          {/* Catch-all for unknown public routes */}
          <Route path="*" element={<HomePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="verify" element={<TicketVerification />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

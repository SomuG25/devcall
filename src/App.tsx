import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DeveloperLogin from './components/DeveloperLogin';
import DeveloperSignup from './components/DeveloperSignup';
import CustomerLogin from './components/CustomerLogin';
import CustomerSignup from './components/CustomerSignup';
import DeveloperDashboard from './pages/DeveloperDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import PaymentPage from './components/PaymentPage';
import VideoCallPage from './components/VideoCallPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/developer-login" element={<DeveloperLogin />} />
        <Route path="/developer-signup" element={<DeveloperSignup />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} />
        <Route path="/developer/dashboard/*" element={<DeveloperDashboard />} />
        <Route path="/customer/dashboard/*" element={<CustomerDashboard />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/call" element={<VideoCallPage />} />
      </Routes>
    </Router>
  );
}

export default App;
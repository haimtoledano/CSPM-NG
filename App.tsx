
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Connectors from './pages/Connectors';
import SecurityCopilot from './pages/SecurityCopilot';
import Settings from './pages/Settings';
import Policies from './pages/Policies';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/connectors" element={<Connectors />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/copilot" element={<SecurityCopilot />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
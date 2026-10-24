import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { AgentLimitsPage } from './pages/AgentLimitsPage.js';
import { CredentialsPage } from './pages/CredentialsPage.js';
import { McpConfigPage } from './pages/McpConfigPage.js';
import { ModelRoutingPage } from './pages/ModelRoutingPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/credentials" replace />} />
        <Route path="/credentials" element={<CredentialsPage />} />
        <Route path="/model-routing" element={<ModelRoutingPage />} />
        <Route path="/agent-limits" element={<AgentLimitsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/mcp-config" element={<McpConfigPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

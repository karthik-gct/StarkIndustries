import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar.js';
import ModelRoutingPage from './pages/ModelRoutingPage.js';

const queryClient = new QueryClient();

function PlaceholderPage({ title }: { title: string }) {
  return <div className="p-6 text-gray-500">{title} — coming soon</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/model-routing" replace />} />
              <Route path="/credentials" element={<PlaceholderPage title="Credentials" />} />
              <Route path="/model-routing" element={<ModelRoutingPage />} />
              <Route path="/agent-limits" element={<PlaceholderPage title="Agent Limits" />} />
              <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
              <Route path="/mcp-config" element={<PlaceholderPage title="MCP Config" />} />
              <Route path="*" element={<div className="p-6 text-gray-500">Page not found</div>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

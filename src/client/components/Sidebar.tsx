import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/credentials', label: 'Credentials' },
  { to: '/model-routing', label: 'Model Routing' },
  { to: '/agent-limits', label: 'Agent Limits' },
  { to: '/projects', label: 'Projects' },
  { to: '/mcp-config', label: 'MCP Config' },
];

export default function Sidebar() {
  return (
    <nav aria-label="Settings navigation" className="w-48 shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Mark3 Settings</p>
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

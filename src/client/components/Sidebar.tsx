import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
<<<<<<< HEAD
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
=======
  { label: 'Credentials', path: '/credentials' },
  { label: 'Model Routing', path: '/model-routing' },
  { label: 'Agent Limits', path: '/agent-limits' },
  { label: 'Projects', path: '/projects' },
  { label: 'MCP Config', path: '/mcp-config' },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900">Mark3 Settings</h1>
      </div>
      <nav aria-label="Main navigation" className="flex-1 px-2 py-4">
        <ul role="list" className="space-y-1">
          {NAV_ITEMS.map(({ label, path }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
>>>>>>> origin/main
  );
}

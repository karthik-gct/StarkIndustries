import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
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
  );
}

import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800'
    }`;

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
            SFS
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Semantic File Search
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          <NavLink to="/upload" className={navLinkClass}>
            Upload
          </NavLink>
          <NavLink to="/files" className={navLinkClass}>
            Files
          </NavLink>
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <NavLink to="/settings" className="block w-full px-4 py-2 text-sm font-medium rounded-md transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 [&.active]:bg-neutral-900 [&.active]:text-white dark:[&.active]:bg-white dark:[&.active]:text-neutral-900 text-center">
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

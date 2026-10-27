import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-navy-500 mb-2" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center text-navy-400 hover:text-teal-700 transition-colors p-1 rounded-md hover:bg-white/80"
        title="Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedName = name
          .replace(/-/g, ' ')
          .replace(/^./, (str) => str.toUpperCase());

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 text-navy-300 flex-shrink-0" />
            {isLast ? (
              <span className="font-bold text-navy-900 bg-white/90 px-2 py-0.5 rounded-md border border-navy-100 shadow-2xs" aria-current="page">
                {formattedName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-teal-700 transition-colors capitalize font-medium text-navy-500 px-1 py-0.5"
              >
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;

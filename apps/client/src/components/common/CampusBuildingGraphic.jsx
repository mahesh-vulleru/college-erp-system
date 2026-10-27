import React from 'react';

/**
 * Architectural Neoclassical College Campus Building Graphic
 * Matches the reference image hero banners across all six dashboards.
 */
export const CampusBuildingGraphic = ({ className = 'w-48 h-28 sm:w-60 sm:h-32' }) => {
  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 280 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="domeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Background Trees / Greenery */}
        <circle cx="28" cy="118" r="16" fill="#15803d" fillOpacity="0.7" />
        <circle cx="44" cy="120" r="14" fill="#16a34a" fillOpacity="0.8" />
        <circle cx="236" cy="120" r="14" fill="#16a34a" fillOpacity="0.8" />
        <circle cx="252" cy="118" r="16" fill="#15803d" fillOpacity="0.7" />

        {/* Base Foundation & Steps */}
        <rect x="25" y="125" width="230" height="7" rx="1.5" fill="#e2e8f0" fillOpacity="0.95" />
        <rect x="20" y="132" width="240" height="6" rx="1.5" fill="#cbd5e1" />
        <rect x="15" y="138" width="250" height="4" rx="1" fill="#94a3b8" />

        {/* Left Wing (Two Floors) */}
        <rect x="35" y="55" width="65" height="70" fill="url(#wallGrad)" stroke="#d97706" strokeWidth="1" />
        <polygon points="30,55 105,55 100,45 35,45" fill="url(#roofGrad)" />
        {/* Left Wing Windows Floor 2 */}
        <rect x="42" y="65" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="61" y="65" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="80" y="65" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        {/* Left Wing Windows Floor 1 */}
        <rect x="42" y="93" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="61" y="93" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="80" y="93" width="12" height="18" rx="2" fill="url(#glassGrad)" />

        {/* Right Wing (Two Floors) */}
        <rect x="180" y="55" width="65" height="70" fill="url(#wallGrad)" stroke="#d97706" strokeWidth="1" />
        <polygon points="175,55 250,55 245,45 180,45" fill="url(#roofGrad)" />
        {/* Right Wing Windows Floor 2 */}
        <rect x="188" y="65" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="207" y="65" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="226" y="65" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        {/* Right Wing Windows Floor 1 */}
        <rect x="188" y="93" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="207" y="93" width="12" height="18" rx="2" fill="url(#glassGrad)" />
        <rect x="226" y="93" width="12" height="18" rx="2" fill="url(#glassGrad)" />

        {/* Central Classical Hall */}
        <rect x="95" y="42" width="90" height="83" fill="#fffbeb" stroke="#d97706" strokeWidth="1.2" />

        {/* Classical Pediment (Triangle Roof) */}
        <polygon points="85,42 195,42 140,15" fill="url(#roofGrad)" stroke="#b45309" strokeWidth="1" />
        <polygon points="95,40 185,40 140,19" fill="#fef3c7" />

        {/* Clock / Crest in Pediment */}
        <circle cx="140" cy="30" r="6" fill="#fff" stroke="#b45309" strokeWidth="1.2" />
        <line x1="140" y1="30" x2="140" y2="26" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
        <line x1="140" y1="30" x2="143" y2="30" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />

        {/* Neoclassical Columns */}
        <g fill="#fef08a" stroke="#d97706" strokeWidth="0.8">
          {/* Column 1 */}
          <rect x="105" y="45" width="6" height="80" rx="1" />
          {/* Column 2 */}
          <rect x="120" y="45" width="6" height="80" rx="1" />
          {/* Column 3 */}
          <rect x="154" y="45" width="6" height="80" rx="1" />
          {/* Column 4 */}
          <rect x="169" y="45" width="6" height="80" rx="1" />
        </g>

        {/* Grand Central Arched Entrance */}
        <path
          d="M 130 125 L 130 85 A 10 10 0 0 1 150 85 L 150 125 Z"
          fill="#1e293b"
          stroke="#b45309"
          strokeWidth="1.2"
        />
        {/* Glass Arched Fanlight */}
        <path
          d="M 132 85 A 8 8 0 0 1 148 85 Z"
          fill="url(#glassGrad)"
        />

        {/* Central Upper Arched Windows */}
        <path d="M 110 65 L 110 55 A 3 3 0 0 1 116 55 L 116 65 Z" fill="url(#glassGrad)" />
        <path d="M 164 65 L 164 55 A 3 3 0 0 1 170 55 L 170 65 Z" fill="url(#glassGrad)" />

        {/* Central Cupola / Flagpole */}
        <rect x="138" y="8" width="4" height="8" fill="#d97706" />
        <circle cx="140" cy="7" r="2.5" fill="url(#domeGrad)" />
        <line x1="140" y1="5" x2="140" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <polygon points="140,0 148,2 140,4" fill="#ef4444" />
      </svg>
    </div>
  );
};

export default CampusBuildingGraphic;


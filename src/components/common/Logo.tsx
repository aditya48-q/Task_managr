import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* GDGoC Geometric Multicolor Symbol */}
      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue bracket */}
          <path
            d="M14 10L6 20L14 30"
            stroke="#4285F4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Red slash */}
          <path
            d="M23 8L17 32"
            stroke="#EA4335"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Green bracket */}
          <path
            d="M26 10L34 20L26 30"
            stroke="#34A853"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Yellow accent dot */}
          <circle cx="20" cy="20" r="2.5" fill="#FBBC04" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-slate-900">GDGoC</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Campus</span>
          </div>
          <span className="text-xs text-slate-500 font-medium truncate">Task Manager</span>
        </div>
      )}
    </div>
  );
};

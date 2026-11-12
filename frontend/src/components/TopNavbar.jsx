import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Shield, User, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navItems } from './Sidebar';

export const TopNavbar = ({ alertCount = 0 }) => {
  const { currentRole, currentRoleId, switchRole, roles } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentNav = navItems.find((n) => n.path === location.pathname) || { name: 'SmartCal Enterprise' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
          {currentNav.name}
        </h1>
        <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">|</span>
        <span className="hidden sm:inline-block text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          Industrial Calibration & QA
        </span>
      </div>

      {/* Right Controls: Role Switcher & Notifications */}
      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="View Active Alerts"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              {currentRole.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <div className="font-semibold text-slate-800 leading-none">{currentRole.name}</div>
              <div className="text-[10px] text-slate-500">{currentRole.department}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role Dropdown Menu */}
          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-up">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" /> Switch RBAC Persona
                </div>
                <div className="py-1">
                  {Object.values(roles).map((r) => {
                    const active = r.id === currentRoleId;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          switchRole(r.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-start justify-between text-xs hover:bg-slate-50 transition-colors ${
                          active ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <div>
                          <div className={`font-semibold ${active ? 'text-blue-700' : 'text-slate-800'}`}>
                            {r.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{r.description}</div>
                        </div>
                        {active && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

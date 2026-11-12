import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Gauge,
  CalendarDays,
  History,
  FileCheck,
  Wrench,
  Factory,
  AlertTriangle,
  Building2,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles
} from 'lucide-react';

export const navItems = [
  { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Instrument Management', path: '/instruments', icon: Gauge },
  { name: 'Calibration Schedule', path: '/schedule', icon: CalendarDays },
  { name: 'Calibration History', path: '/calibrations', icon: History },
  { name: 'Certificates', path: '/certificates', icon: FileCheck },
  { name: 'Work Orders', path: '/work-orders', icon: Wrench },
  { name: 'Production Usage', path: '/production-usage', icon: Factory },
  { name: 'Alerts & Exceptions', path: '/alerts', icon: AlertTriangle },
  { name: 'Suppliers', path: '/suppliers', icon: Building2 },
  { name: 'Audit Trail', path: '/audit-trail', icon: FileText },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { name: 'Data Validation', path: '/validation', icon: ShieldCheck },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ alertCount = 0 }) => {
  return (
    <aside className="w-64 bg-[#142B4A] text-slate-300 flex flex-col shrink-0 h-screen select-none border-r border-navy-900 sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Gauge className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
            SmartCal
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-500/30 text-blue-300 border border-blue-400/20">
              SaaS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Metrology ERP</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Operations & Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.name === 'Alerts & Exceptions' && alertCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 bg-[#0c1b30]/50 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            MySQL Connected
          </span>
          <span className="text-[10px] text-slate-500 font-mono">v2.4-ENT</span>
        </div>
      </div>
    </aside>
  );
};

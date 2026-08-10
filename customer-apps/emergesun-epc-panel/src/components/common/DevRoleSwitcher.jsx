import React from 'react';
import { ChevronDown } from 'lucide-react';
import useStore from '../../store/useStore';
import { roles } from '../../mocks/roles';

export default function DevRoleSwitcher() {
  const { devRoleOverride, setDevRoleOverride, user } = useStore();
  const currentRole = devRoleOverride || user?.roleCode;

  return (
    <div className="relative hidden md:flex items-center">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-700">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="hidden lg:inline">DEV:</span>
        <select
          value={currentRole || ''}
          onChange={(e) => setDevRoleOverride(e.target.value || null)}
          className="bg-transparent outline-none text-amber-700 font-semibold cursor-pointer text-xs max-w-[110px]">
          <option value="">— Role —</option>
          {roles.map((r) => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

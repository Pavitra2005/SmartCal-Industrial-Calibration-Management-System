import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: {
    id: 'ADMIN',
    name: 'Administrator',
    department: 'Plant Operations & Metrology',
    userName: 'Alex Mercer (Admin)',
    description: 'Full system administration, data generation, and global policy control.'
  },
  QUALITY_ENGINEER: {
    id: 'QUALITY_ENGINEER',
    name: 'Quality Engineer',
    department: 'Quality Assurance & Metrology',
    userName: 'Dr. Helen Brewster (QE)',
    description: 'Calibration execution, certificate approval, impact assessments, and alert investigation.'
  },
  PRODUCTION_PLANNER: {
    id: 'PRODUCTION_PLANNER',
    name: 'Production Planner',
    department: 'Production Scheduling',
    userName: 'Marcus Brody (Planner)',
    description: 'View calibration schedules, track downtime, and coordinate maintenance work orders.'
  },
  PLANT_OPERATOR: {
    id: 'PLANT_OPERATOR',
    name: 'Plant Operator',
    department: 'Line 1 - CNC Milling',
    userName: 'Carlos Mendez (Operator)',
    description: 'View instruments and validate/record production batch tool usage.'
  }
};

export const AuthProvider = ({ children }) => {
  const [currentRoleId, setCurrentRoleId] = useState(() => {
    return localStorage.getItem('smartcal_user_role') || 'ADMIN';
  });

  const switchRole = (roleId) => {
    if (ROLES[roleId]) {
      setCurrentRoleId(roleId);
      localStorage.setItem('smartcal_user_role', roleId);
    }
  };

  const currentRole = ROLES[currentRoleId] || ROLES.ADMIN;

  const permissions = {
    isAdmin: currentRoleId === 'ADMIN',
    isQualityEngineer: currentRoleId === 'QUALITY_ENGINEER' || currentRoleId === 'ADMIN',
    isProductionPlanner: currentRoleId === 'PRODUCTION_PLANNER' || currentRoleId === 'ADMIN',
    isOperator: currentRoleId === 'PLANT_OPERATOR' || currentRoleId === 'ADMIN',
    canExecuteCalibration: currentRoleId === 'QUALITY_ENGINEER' || currentRoleId === 'ADMIN',
    canManagePlans: currentRoleId === 'QUALITY_ENGINEER' || currentRoleId === 'ADMIN',
    canManageWorkOrders: currentRoleId === 'PRODUCTION_PLANNER' || currentRoleId === 'QUALITY_ENGINEER' || currentRoleId === 'ADMIN',
    canRecordUsage: true,
    canReseed: currentRoleId === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={{ currentRole, currentRoleId, switchRole, permissions, roles: ROLES }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

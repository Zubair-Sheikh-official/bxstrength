import React from 'react';
import { User } from '../../types';
import { AdminCRM } from '../admin/AdminCRM';

interface CoachDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
}

/**
 * Coach Dashboard Container
 * 
 * Provides specialist coaches with access to their assigned clients,
 * workout program delivery, diet plan management, and task updates.
 */
export const CoachDashboard: React.FC<CoachDashboardProps> = ({ user, onLogout, onNavigateHome }) => {
  return (
    <AdminCRM
      user={user}
      onLogout={onLogout}
      onNavigateHome={onNavigateHome}
    />
  );
};

export default CoachDashboard;

import React from 'react';
import { User } from '../../types';
import { AdminCRM } from '../admin/AdminCRM';

interface HeadCoachDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
}

/**
 * Head Coach Dashboard Container
 * 
 * Provides Head Coach specific oversight, central assignment engine,
 * workout program architecture approvals, nutrition plan reviews,
 * and coach-to-client delegation workflows.
 */
export const HeadCoachDashboard: React.FC<HeadCoachDashboardProps> = ({ user, onLogout, onNavigateHome }) => {
  return (
    <AdminCRM
      user={user}
      onLogout={onLogout}
      onNavigateHome={onNavigateHome}
    />
  );
};

export default HeadCoachDashboard;

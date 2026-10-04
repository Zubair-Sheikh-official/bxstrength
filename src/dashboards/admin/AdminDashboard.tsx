import React from 'react';
import { User } from '../../types';
import { AdminCRM } from './AdminCRM';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
}

/**
 * Admin Dashboard Container
 * 
 * Provides master administrative control over the BxStrength platform,
 * including user management, coach assignments, financial subscriptions,
 * system security audit logs, and website enquiries.
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onNavigateHome }) => {
  return (
    <AdminCRM
      user={user}
      onLogout={onLogout}
      onNavigateHome={onNavigateHome}
    />
  );
};

export default AdminDashboard;

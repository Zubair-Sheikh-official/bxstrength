import React from 'react';
import { User } from '../../types';
import { SupportDashboardView } from './SupportDashboardView';

interface CustomerSupportDashboardProps {
  user?: User;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onShowToast?: (msg: string) => void;
}

/**
 * Customer Support Dashboard Container
 * 
 * Manages customer inquiries, support tickets, SLA response times,
 * and escalation to Head Coaches or Admins.
 */
export const CustomerSupportDashboard: React.FC<CustomerSupportDashboardProps> = ({
  user,
  onLogout,
  onNavigateHome,
  onShowToast
}) => {
  return (
    <SupportDashboardView
      onShowToast={onShowToast}
      onLogout={onLogout}
      onNavigateHome={onNavigateHome}
    />
  );
};

export default CustomerSupportDashboard;

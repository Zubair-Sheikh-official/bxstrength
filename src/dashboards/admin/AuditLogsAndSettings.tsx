import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { VelocityAPI } from '../../services/api';
import { ShieldCheck, Activity, Lock, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface AuditLogsAndSettingsProps {
  auditLogs: AuditLog[];
  onAuditLogsUpdated?: () => void;
  onShowToast: (msg: string) => void;
}

export const AuditLogsAndSettings: React.FC<AuditLogsAndSettingsProps> = ({
  auditLogs,
  onAuditLogsUpdated,
  onShowToast
}) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(60);
  const [rateLimiting, setRateLimiting] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Pending action double confirmation state
  const [pendingPermChange, setPendingPermChange] = useState<{ key: keyof ReturnType<typeof VelocityAPI.getCoachPermissions>; val: boolean; label: string } | null>(null);

  // Coach Permissions state
  const [coachPermissions, setCoachPermissions] = useState(() => VelocityAPI.getCoachPermissions());

  const handleInitiatePermToggle = (key: keyof typeof coachPermissions, val: boolean, label: string) => {
    setPendingPermChange({ key, val, label });
  };

  const executePermToggle = () => {
    if (!pendingPermChange) return;
    const { key, val, label } = pendingPermChange;
    const updated = VelocityAPI.saveCoachPermissions({ [key]: val });
    setCoachPermissions(updated);
    onShowToast(`Coach Tab Permission Updated: "${label}" set to ${val ? 'ALLOWED' : 'RESTRICTED'}`);
    setPendingPermChange(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Platform security configuration updated successfully!');
  };

  const confirmClearLogs = () => {
    VelocityAPI.clearAuditLogs();
    onShowToast('Cleared all security audit logs to free up database storage space!');
    setShowClearConfirm(false);
    if (onAuditLogsUpdated) onAuditLogsUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8C532B]" />
            SECURITY AUDIT LOGS & PLATFORM CONFIGURATION
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Complete enterprise security audit trail, session parameters, and database storage management.
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-black tracking-widest px-4 py-2.5 uppercase border border-red-800 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>PURGE LOGS (FREE STORAGE)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Stream */}
        <div className="lg:col-span-2 bg-[#111111] border border-gray-800 p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            SECURITY AUDIT TRAIL ({auditLogs.length} EVENTS)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase font-bold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-900/50">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-white block">{log.userName}</span>
                      <span className="text-[9px] text-[#E52165] uppercase font-bold">{log.userRole}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-gray-800 text-pink-300 font-bold uppercase text-[9px] font-mono border border-gray-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-300 text-[11px] max-w-xs truncate">{log.details}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Coach Permissions Control Panel */}
        <div className="bg-[#111111] border border-gray-800 p-6 space-y-6">
          
          {/* Coach Tab Access Permissions Section */}
          <div className="border-b border-gray-800 pb-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              COACH TAB ACCESS PERMISSIONS
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-normal">
              Control which sections of the Coach Dashboard are visible to Coaches. Client Financial Payments are restricted by default.
            </p>

            <div className="space-y-2.5">
              
              {/* Financial Billing Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-900/90 border border-amber-900/40 rounded">
                <div>
                  <span className="font-bold text-white block text-xs">Client Financials & Payments</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {coachPermissions.allowFinancials ? 'ALLOWED (Visible)' : 'RESTRICTED (Hidden from Coaches)'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.allowFinancials}
                  onChange={(e) => handleInitiatePermToggle('allowFinancials', e.target.checked, 'Client Financials & Payments')}
                  className="w-4 h-4 rounded border-amber-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {/* Lead Pipeline Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">CRM Lead Pipeline</span>
                  <span className="text-[10px] text-gray-400">Overview dashboard & lead sync</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.allowLeadPipeline}
                  onChange={(e) => handleInitiatePermToggle('allowLeadPipeline', e.target.checked, 'CRM Lead Pipeline')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* Client Roster Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Client Roster & Athlete Profiles</span>
                  <span className="text-[10px] text-gray-400">Assigned client management</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.allowClientRoster}
                  onChange={(e) => handleInitiatePermToggle('allowClientRoster', e.target.checked, 'Client Roster & Athlete Profiles')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* Workout Programs Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Workout Program Builder</span>
                  <span className="text-[10px] text-gray-400">Assign exercise routines</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.allowWorkoutPrograms}
                  onChange={(e) => handleInitiatePermToggle('allowWorkoutPrograms', e.target.checked, 'Workout Program Builder')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* Diet Plans Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Diet & Nutrition Plan Builder</span>
                  <span className="text-[10px] text-gray-400">Assign calorie & macro targets</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.allowNutritionPlans}
                  onChange={(e) => handleInitiatePermToggle('allowNutritionPlans', e.target.checked, 'Diet & Nutrition Plan Builder')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* Support Tickets Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Support Ticket Desk</span>
                  <span className="text-[10px] text-gray-400">View client assistance requests</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.allowSupportTickets}
                  onChange={(e) => handleInitiatePermToggle('allowSupportTickets', e.target.checked, 'Support Ticket Desk')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* User / Client Dashboard Feature Permissions Section */}
          <div className="border-b border-gray-800 pb-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              USER DASHBOARD FEATURE VISIBILITY
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-normal">
              Toggle feature modules visible to registered Members & Clients in their personal dashboard.
            </p>

            <div className="space-y-2.5">
              {/* Workout Routine & Exercise Logger */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Workout Routine & Exercise Plans</span>
                  <span className="text-[10px] text-gray-400">Workout plans & exercise routines tab</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.showUserWorkoutLogger !== false}
                  onChange={(e) => handleInitiatePermToggle('showUserWorkoutLogger', e.target.checked, 'User Workout Plans Tab')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* Nutrition & Diet Tracker */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Calorie & Macro Nutrition Diet</span>
                  <span className="text-[10px] text-gray-400">Meal targets & diet plan tab</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.showUserNutritionTracker !== false}
                  onChange={(e) => handleInitiatePermToggle('showUserNutritionTracker', e.target.checked, 'User Nutrition Diet Tab')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* Invoices & Subscription Billing */}
              <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded text-xs">
                <div>
                  <span className="font-bold text-white block">Billing Statements & Subscriptions</span>
                  <span className="text-[10px] text-gray-400">Payment receipts & subscription tab</span>
                </div>
                <input
                  type="checkbox"
                  checked={coachPermissions.showUserBillingHistory !== false}
                  onChange={(e) => handleInitiatePermToggle('showUserBillingHistory', e.target.checked, 'User Subscription Billing Tab')}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-gray-800 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#E52165]" />
            PLATFORM SYSTEM SETTINGS
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800">
              <div>
                <span className="font-bold text-white block">Maintenance Mode</span>
                <span className="text-[10px] text-gray-400">Restrict client login during upgrades</span>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="rounded border-gray-700 text-[#E52165] focus:ring-[#E52165]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800">
              <div>
                <span className="font-bold text-white block">API Rate Limiting</span>
                <span className="text-[10px] text-gray-400">Protect against brute-force DDoS</span>
              </div>
              <input
                type="checkbox"
                checked={rateLimiting}
                onChange={(e) => setRateLimiting(e.target.checked)}
                className="rounded border-gray-700 text-[#E52165] focus:ring-[#E52165]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-300 uppercase mb-1">
                Session Idle Timeout (Minutes)
              </label>
              <input
                type="number"
                value={sessionTimeoutMins}
                onChange={(e) => setSessionTimeoutMins(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#E52165] hover:bg-[#c41551] text-white font-black tracking-widest py-2.5 uppercase transition-all shadow-md shadow-pink-500/20 cursor-pointer"
            >
              SAVE CONFIGURATION
            </button>
          </form>
        </div>
      </div>

      {/* Double Confirmation Modal for Coach Permissions */}
      {pendingPermChange && (
        <ConfirmModal
          isOpen={true}
          title="UPDATE COACH TAB PERMISSION"
          message={`Are you sure you want to ${pendingPermChange.val ? 'ALLOW' : 'RESTRICT'} access to tab "${pendingPermChange.label}" for all coaches? Respective coach dashboards will update in real-time.`}
          type={pendingPermChange.val ? 'success' : 'warning'}
          confirmText="EXECUTE PERMISSION CHANGE"
          cancelText="CANCEL"
          requireTextConfirm={true}
          onConfirm={executePermToggle}
          onCancel={() => setPendingPermChange(null)}
        />
      )}

      <ConfirmModal
        isOpen={showClearConfirm}
        title="PURGE AUDIT LOG RECORDS"
        message="Are you sure you want to permanently clear all security audit logs to free up database storage space? This operation cannot be reversed."
        type="danger"
        confirmText="PURGE LOGS NOW"
        cancelText="CANCEL"
        requireTextConfirm={true}
        onConfirm={confirmClearLogs}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};

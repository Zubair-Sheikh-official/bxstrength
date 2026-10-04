import React, { useState } from 'react';
import { NutritionPlan, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { 
  Utensils, Plus, UserCheck, Trash2, X, Edit, ShieldCheck, Send, CheckCircle2, 
  Clock, XCircle, AlertTriangle, History, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface NutritionManagerProps {
  plans: NutritionPlan[];
  clients: User[];
  coaches?: User[];
  user?: User;
  onPlansUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const NutritionManager: React.FC<NutritionManagerProps> = ({
  plans,
  clients,
  coaches = [],
  user,
  onPlansUpdated,
  onShowToast
}) => {
  const currentUser = user || VelocityAPI.getCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<{ id: string; title: string } | null>(null);

  // Audit logs drawer toggle state
  const [openAuditLogs, setOpenAuditLogs] = useState<Record<string, boolean>>({});

  // Action notes modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'accept' | 'request_changes' | 'reject' | 'submit_review' | 'headcoach_approve';
    planId: string;
    planTitle: string;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const [title, setTitle] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [assignedCoachName, setAssignedCoachName] = useState('');
  const [dailyCalories, setDailyCalories] = useState(2400);
  const [proteinG, setProteinG] = useState(190);
  const [carbsG, setCarbsG] = useState(220);
  const [fatG, setFatG] = useState(70);

  const availableCoachOptions = Array.from(
    new Set([
      ...(coaches || []).map((c) => c.name),
      'Shaban Faridi',
      'Moheeb Khan',
      'Sadeem'
    ])
  ).filter(Boolean);

  const isHeadCoachOrAdmin = !user || user.role === 'headcoach' || user.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const displayPlans = isHeadCoachOrAdmin
    ? plans
    : plans.filter(
        (p) =>
          p.assignedCoachName === user?.name ||
          p.assignedCoachName === user?.id ||
          p.createdBy === user?.name ||
          p.createdBy === user?.id
      );

  const toggleAuditLog = (planId: string) => {
    setOpenAuditLogs(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  const handleOpenCreate = () => {
    setEditingPlanId(null);
    setTitle('');
    setAssignedUserId('');
    setAssignedCoachName('');
    setDailyCalories(2400);
    setProteinG(190);
    setCarbsG(220);
    setFatG(70);
    setShowModal(true);
  };

  const handleOpenEdit = (plan: NutritionPlan) => {
    setEditingPlanId(plan.id);
    setTitle(plan.title || '');
    setAssignedUserId(plan.assignedToUserId || '');
    setAssignedCoachName(plan.assignedCoachName || '');
    setDailyCalories(plan.dailyCalories || 2400);
    setProteinG(plan.targetProteinG || 190);
    setCarbsG(plan.targetCarbsG || 220);
    setFatG(plan.targetFatG || 70);
    setShowModal(true);
  };

  const handleDeleteTrigger = (id: string, planTitle: string) => {
    setDeletingPlan({ id, title: planTitle });
  };

  const confirmDelete = () => {
    if (deletingPlan) {
      VelocityAPI.deleteNutritionPlan(deletingPlan.id);
      onShowToast(`Deleted diet plan "${deletingPlan.title}"`);
      setDeletingPlan(null);
      onPlansUpdated();
    }
  };

  const handlePublishToClient = (plan: NutritionPlan) => {
    VelocityAPI.publishNutritionPlanToClient(plan.id);
    onShowToast(`Diet plan "${plan.title}" (v${(plan.version || 1) + 1}.0) published & synced to ${plan.assignedToUserName || 'Client Dashboard'}!`);
    onPlansUpdated();
  };

  const openApprovalActionModal = (
    type: 'accept' | 'request_changes' | 'reject' | 'submit_review' | 'headcoach_approve',
    planId: string,
    planTitle: string
  ) => {
    setActionNotes('');
    setActionModal({ isOpen: true, type, planId, planTitle });
  };

  const executeApprovalAction = () => {
    if (!actionModal) return;
    const { type, planId, planTitle } = actionModal;

    if (type === 'accept') {
      VelocityAPI.acceptAssignment('nutrition', planId, actionNotes);
      onShowToast(`Accepted assignment for diet plan "${planTitle}"`);
    } else if (type === 'reject') {
      VelocityAPI.rejectAssignment('nutrition', planId, actionNotes || 'Assignment rejected by coach.');
      onShowToast(`Rejected assignment for diet plan "${planTitle}"`);
    } else if (type === 'request_changes') {
      VelocityAPI.requestChangesOnAssignment('nutrition', planId, actionNotes || 'Requested revisions on diet plan.');
      onShowToast(`Requested changes on diet plan "${planTitle}"`);
    } else if (type === 'submit_review') {
      VelocityAPI.submitForApproval('nutrition', planId, actionNotes || 'Submitted for Head Coach review.');
      onShowToast(`Submitted diet plan "${planTitle}" for Head Coach approval`);
    } else if (type === 'headcoach_approve') {
      VelocityAPI.approveByHeadCoach('nutrition', planId, actionNotes || 'Approved by Head Coach.');
      onShowToast(`Head Coach approved diet plan "${planTitle}"`);
    }

    setActionModal(null);
    onPlansUpdated();
  };

  const getStatusBadge = (plan: NutritionPlan) => {
    const status = plan.status || 'assigned';
    switch (status) {
      case 'assigned':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" /> Assigned — Pending Coach Review
          </span>
        );
      case 'coach_accepted':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-800 rounded flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-blue-400" /> Coach Accepted & In Progress
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-sky-950/80 text-sky-300 border border-sky-800 rounded flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-sky-400" /> In Progress
          </span>
        );
      case 'headcoach_review':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-purple-950/80 text-purple-300 border border-purple-800 rounded flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-purple-400 animate-pulse" /> Submitted for Head Coach Review
          </span>
        );
      case 'approved':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Approved by Head Coach
          </span>
        );
      case 'published_to_client':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-teal-950/80 text-teal-300 border border-teal-800 rounded flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-teal-400" /> Published to Client (v{plan.version || 1}.0)
          </span>
        );
      case 'change_requested':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-orange-950/80 text-orange-300 border border-orange-800 rounded flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-orange-400" /> Revisions / Changes Requested
          </span>
        );
      case 'coach_rejected':
      case 'rejected':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-red-950/80 text-red-300 border border-red-800 rounded flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-red-400" /> Rejected
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-gray-800 text-gray-300 border border-gray-700 rounded">
            {status}
          </span>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Plan title is required');
      return;
    }

    const assignedUser = clients.find((c) => c.id === assignedUserId);

    const existingPlan = editingPlanId ? plans.find((p) => p.id === editingPlanId) : null;
    const meals = existingPlan?.meals?.length
      ? existingPlan.meals
      : [
          { id: 'm-1', mealName: 'Power Breakfast', timeSlot: '08:00 AM', description: '4 Eggs, Oats, Berries', calories: Math.round(Number(dailyCalories) * 0.25), proteinG: Math.round(Number(proteinG) * 0.25), carbsG: Math.round(Number(carbsG) * 0.25), fatG: Math.round(Number(fatG) * 0.25) },
          { id: 'm-2', mealName: 'Post-Workout Fuel', timeSlot: '01:00 PM', description: 'Grilled Chicken, Rice, Greens', calories: Math.round(Number(dailyCalories) * 0.35), proteinG: Math.round(Number(proteinG) * 0.35), carbsG: Math.round(Number(carbsG) * 0.35), fatG: Math.round(Number(fatG) * 0.25) },
          { id: 'm-3', mealName: 'Dinner', timeSlot: '07:30 PM', description: 'Salmon, Sweet Potato', calories: Math.round(Number(dailyCalories) * 0.40), proteinG: Math.round(Number(proteinG) * 0.40), carbsG: Math.round(Number(carbsG) * 0.40), fatG: Math.round(Number(fatG) * 0.50) }
        ];

    const savedPlan = VelocityAPI.saveNutritionPlan({
      ...(editingPlanId ? { id: editingPlanId } : {}),
      title: title.trim(),
      assignedToUserId: assignedUser ? assignedUser.id : undefined,
      assignedToUserName: assignedUser ? assignedUser.name : undefined,
      assignedCoachName: assignedCoachName || undefined,
      dailyCalories: Number(dailyCalories),
      targetProteinG: Number(proteinG),
      targetCarbsG: Number(carbsG),
      targetFatG: Number(fatG),
      meals
    });

    if (assignedCoachName && assignedCoachName.trim()) {
      VelocityAPI.saveCoachAssignment({
        assignmentType: 'nutrition_plan',
        referenceId: savedPlan.id,
        title: title.trim(),
        description: `Target Calories: ${dailyCalories} kcal (${proteinG}g P / ${carbsG}g C / ${fatG}g F)`,
        instructions: `Review macronutrient split, customize meal schedules, and publish plan to client.`,
        assignedCoachName: assignedCoachName.trim(),
        clientId: assignedUser?.id,
        clientName: assignedUser?.name || 'Assigned Client Athlete',
        serviceName: `Nutrition & Diet Coaching`,
        assignedByName: currentUser?.name || 'Shaban Faridi',
        assignedByRole: 'Head Coach',
        dueDate: 'Weekly Macro Adjustment',
        priority: 'medium',
        status: 'assigned',
        details: { dailyCalories, proteinG, carbsG, fatG }
      });
    }

    onShowToast(editingPlanId ? `Updated diet plan "${title}"!` : `Created & assigned diet plan "${title}"!`);
    setShowModal(false);
    onPlansUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#8C532B]" />
            NUTRITION & DIET PLAN APPROVAL WORKFLOW
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Build custom diet plans, set calorie/macro targets, review & approve assignments, view audit logs, and publish live to clients.
          </p>
        </div>

        {isHeadCoachOrAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-[#8C532B] hover:bg-[#70401E] text-white text-xs font-black tracking-widest px-5 py-3 uppercase shadow-md shadow-amber-950/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>BUILD DIET PLAN</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPlans.length === 0 ? (
          <div className="col-span-full bg-[#111111] border border-gray-800 p-8 text-center text-gray-500">
            No diet plans assigned or available yet.
          </div>
        ) : (
          displayPlans.map((p) => {
            const isAuditOpen = !!openAuditLogs[p.id];
            const isApprovedOrPublished = p.status === 'approved' || p.status === 'published_to_client' || p.isPublishedToClient;
            const canPublish = isApprovedOrPublished || isAdmin;

            return (
              <div key={p.id} className="bg-[#111111] border border-gray-800 p-5 flex flex-col justify-between hover:border-[#8C532B]/50 transition-all rounded-lg shadow-lg">
                <div>
                  {/* Assignment Attribution Header */}
                  <div className="bg-[#191610] border border-amber-800/40 p-2.5 mb-3 rounded flex flex-wrap items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Assigned by {p.assignedBy || 'Shaban Faridi'} — {p.assignedByRole || 'Head Coach'}</span>
                    </div>
                    <span className="text-[10px] text-amber-200/70 font-mono">
                      {new Date(p.assignedAt || p.updatedAt).toLocaleDateString()} {new Date(p.assignedAt || p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-pink-400 bg-pink-950/40 px-2 py-0.5 border border-pink-900/60 rounded">{p.dailyCalories} KCAL / DAY</span>
                      {p.version && p.version > 1 && (
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 border border-sky-800 rounded">
                          v{p.version}.0
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded transition-colors cursor-pointer"
                        title="Edit Diet Plan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {isHeadCoachOrAdmin && (
                        <button
                          onClick={() => handleDeleteTrigger(p.id, p.title)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded transition-colors cursor-pointer"
                          title="Delete Diet Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black uppercase text-white mb-2">{p.title}</h3>

                  {/* Status Badge Pill */}
                  <div className="mb-3">
                    {getStatusBadge(p)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {p.assignedToUserName ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 border border-emerald-800 flex items-center gap-1 rounded">
                        <UserCheck className="w-3 h-3" /> Client: {p.assignedToUserName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 border border-gray-800 rounded">
                        Unassigned Client
                      </span>
                    )}

                    {p.assignedCoachName ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 border border-amber-800 flex items-center gap-1 rounded">
                        <ShieldCheck className="w-3 h-3" /> Coach: {p.assignedCoachName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 border border-gray-800 rounded">
                        No Coach Assigned
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-gray-900 p-3 border border-gray-800 rounded">
                    <div>
                      <span className="block text-gray-400 text-[10px]">PROTEIN</span>
                      <span className="text-pink-400 font-bold">{p.targetProteinG}g</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-[10px]">CARBS</span>
                      <span className="text-blue-400 font-bold">{p.targetCarbsG}g</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-[10px]">FATS</span>
                      <span className="text-amber-400 font-bold">{p.targetFatG}g</span>
                    </div>
                  </div>

                  {/* COACH APPROVAL ACTION BAR */}
                  <div className="bg-gray-950 p-3 border border-gray-800 rounded space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Coach & Head Coach Approval Actions:
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {(p.status === 'assigned' || p.status === 'change_requested' || !p.status) && (
                        <>
                          <button
                            onClick={() => openApprovalActionModal('accept', p.id, p.title)}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept Assignment
                          </button>

                          <button
                            onClick={() => openApprovalActionModal('request_changes', p.id, p.title)}
                            className="bg-orange-950 hover:bg-orange-900 text-orange-300 border border-orange-800 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Request Changes
                          </button>

                          <button
                            onClick={() => openApprovalActionModal('reject', p.id, p.title)}
                            className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}

                      {(p.status === 'coach_accepted' || p.status === 'in_progress') && (
                        <button
                          onClick={() => openApprovalActionModal('submit_review', p.id, p.title)}
                          className="bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700 text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit for Head Coach Review
                        </button>
                      )}

                      {(p.status === 'headcoach_review' || isHeadCoachOrAdmin) && p.status !== 'approved' && p.status !== 'published_to_client' && (
                        <button
                          onClick={() => openApprovalActionModal('headcoach_approve', p.id, p.title)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Head Coach Approve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PUBLISH TO CLIENT BAR */}
                  <div className="bg-gray-950 p-2.5 border border-gray-800 rounded flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Client Status:</span>
                      <span className="text-[11px] font-semibold text-gray-300">
                        {p.isPublishedToClient
                          ? `Live on Client Dashboard (v${p.version || 1}.0)`
                          : 'Hidden from Client Dashboard'}
                      </span>
                    </div>

                    {p.isPublishedToClient ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 border border-emerald-800 flex items-center gap-1 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published {p.publishedToClientAt ? `(${new Date(p.publishedToClientAt).toLocaleDateString()})` : ''}
                        </span>

                        <button
                          onClick={() => handlePublishToClient(p)}
                          className="bg-blue-900 hover:bg-blue-800 text-blue-200 text-[11px] font-bold px-2.5 py-1 uppercase rounded border border-blue-700 cursor-pointer"
                          title="Publish updated version to client"
                        >
                          Re-Publish Update
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePublishToClient(p)}
                        disabled={!canPublish}
                        className={`text-xs font-black px-3 py-1.5 uppercase flex items-center gap-1.5 shadow rounded transition-all ${
                          canPublish
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
                        }`}
                        title={canPublish ? 'Publish plan to client' : 'Approval required before publishing'}
                      >
                        <Send className="w-3.5 h-3.5" /> Send / Publish to Client
                      </button>
                    )}
                  </div>

                  {/* AUDIT LOG & REJECTION REASONS DRAWER TOGGLE */}
                  <div className="mt-3">
                    <button
                      onClick={() => toggleAuditLog(p.id)}
                      className="w-full text-left bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-amber-400" />
                        Approval Audit Trail ({p.approvalLogs ? p.approvalLogs.length : 0} logs)
                      </span>
                      {isAuditOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isAuditOpen && (
                      <div className="mt-2 bg-black border border-gray-800 p-3 rounded space-y-2 text-xs">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-800 pb-1">
                          Internal Approval & Assignment History:
                        </span>
                        {(!p.approvalLogs || p.approvalLogs.length === 0) ? (
                          <p className="text-[11px] text-gray-500 italic">No approval logs recorded yet.</p>
                        ) : (
                          p.approvalLogs.map((log) => (
                            <div key={log.id} className="border-l-2 border-amber-600 pl-2 py-1 space-y-0.5 text-[11px]">
                              <div className="flex items-center justify-between text-gray-400">
                                <span className="font-bold text-amber-300">{log.actorName} ({log.actorRole})</span>
                                <span className="font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <span className="font-bold text-white uppercase text-[10px] block">{log.action.replace(/_/g, ' ')}</span>
                              {log.notes && <p className="text-gray-300 bg-gray-900 p-1.5 rounded border border-gray-800">{log.notes}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Notes Modal */}
      {actionModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-lg overflow-y-auto flex flex-col justify-center">
            <button onClick={() => setActionModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              {actionModal.type === 'accept' && 'ACCEPT ASSIGNMENT'}
              {actionModal.type === 'request_changes' && 'REQUEST CHANGES / REVISIONS'}
              {actionModal.type === 'reject' && 'REJECT ASSIGNMENT'}
              {actionModal.type === 'submit_review' && 'SUBMIT FOR HEAD COACH REVIEW'}
              {actionModal.type === 'headcoach_approve' && 'HEAD COACH APPROVAL'}
            </h3>

            <p className="text-xs text-gray-400 mb-4">
              Diet Plan: <strong className="text-white">{actionModal.planTitle}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Internal Notes / Feedback Comments
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter specific comments, rationale, or feedback..."
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-800 text-white p-3 text-xs outline-none rounded"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  * Note: Internal approval notes and rejection comments remain strictly hidden from clients.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-bold uppercase rounded hover:bg-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeApprovalAction}
                  className="px-5 py-2 bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black uppercase rounded shadow cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl overflow-y-auto flex flex-col">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase text-white mb-4">
              {editingPlanId ? 'EDIT DIET PLAN' : 'BUILD DIET PLAN'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Plan Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High Protein Lean Muscle Diet"
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Assign Client (Optional)</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                >
                  <option value="">-- Unassigned Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Assign Coach (Optional)</label>
                <select
                  value={assignedCoachName}
                  onChange={(e) => setAssignedCoachName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                >
                  <option value="">-- Select Coach --</option>
                  {availableCoachOptions.map((cName) => (
                    <option key={cName} value={cName}>{cName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Daily Calories</label>
                  <input
                    type="number"
                    value={dailyCalories}
                    onChange={(e) => setDailyCalories(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={proteinG}
                    onChange={(e) => setProteinG(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbsG}
                    onChange={(e) => setCarbsG(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={fatG}
                    onChange={(e) => setFatG(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black tracking-widest py-3 uppercase shadow-md shadow-pink-500/20"
              >
                {editingPlanId ? 'UPDATE DIET PLAN' : 'SAVE & ASSIGN DIET PLAN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Confirm Modal for Delete Diet Plan */}
      <ConfirmModal
        isOpen={!!deletingPlan}
        title="DELETE DIET PLAN"
        message={`Are you sure you want to delete the diet plan "${deletingPlan?.title}"?`}
        type="danger"
        confirmText="DELETE DIET PLAN"
        cancelText="KEEP DIET PLAN"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPlan(null)}
      />
    </div>
  );
};

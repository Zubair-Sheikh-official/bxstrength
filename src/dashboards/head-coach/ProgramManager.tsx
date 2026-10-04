import React, { useState, useEffect } from 'react';
import { WorkoutProgram, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { 
  Dumbbell, Plus, Trash2, Edit2, UserCheck, ShieldCheck, X, Send, Search, Filter, RotateCcw,
  CheckCircle2, Clock, XCircle, AlertTriangle, History, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface ProgramManagerProps {
  programs: WorkoutProgram[];
  clients: User[];
  coaches?: User[];
  user?: User;
  onProgramsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({
  programs,
  clients,
  coaches = [],
  user,
  onProgramsUpdated,
  onShowToast
}) => {
  const currentUser = user || VelocityAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isHeadCoachRole = currentUser?.role === 'headcoach' || (currentUser?.role === 'coach' && Boolean(currentUser.coachPosition?.toLowerCase().includes('head')));
  const isHeadCoachOrAdmin = isAdmin || isHeadCoachRole || !currentUser;

  // Audit logs toggle state per program ID
  const [openAuditLogs, setOpenAuditLogs] = useState<Record<string, boolean>>({});

  // Action notes modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'accept' | 'request_changes' | 'reject' | 'submit_review' | 'headcoach_approve';
    programId: string;
    programTitle: string;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Dynamic coach list resolution
  const availableCoachOptions = React.useMemo(() => {
    const list: string[] = [];
    if (coaches && coaches.length > 0) {
      list.push(...coaches.map((c) => c.name));
    }
    try {
      const allUsers = VelocityAPI.getUsers();
      if (Array.isArray(allUsers)) {
        const coachUsers = allUsers.filter((u) => u.role === 'coach' || u.role === 'headcoach');
        list.push(...coachUsers.map((c) => c.name));
      }
    } catch { }

    const defaults = ['Shaban Faridi', 'Moheeb Khan', 'Sadeem'];
    list.push(...defaults);

    return Array.from(new Set(list.map((n) => String(n).trim()).filter(Boolean)));
  }, [coaches]);

  // Filter programs based on logged in role
  const displayPrograms = React.useMemo(() => {
    if (isHeadCoachOrAdmin) return programs;
    if (!currentUser) return programs;
    const coachNameLower = currentUser.name.toLowerCase();
    return programs.filter((p) => {
      const isAssignedToCoach = p.assignedCoachName && p.assignedCoachName.toLowerCase() === coachNameLower;
      const isCreatedByCoach = p.createdBy && p.createdBy.toLowerCase() === coachNameLower;
      return isAssignedToCoach || isCreatedByCoach || !p.assignedCoachName;
    });
  }, [programs, isHeadCoachOrAdmin, currentUser]);

  // Admin Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filteredPrograms = React.useMemo(() => {
    return displayPrograms.filter((prog) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesTitle = prog.title.toLowerCase().includes(term);
        const matchesClient = (prog.assignedToUserName || '').toLowerCase().includes(term);
        const matchesCoach = (prog.assignedCoachName || prog.createdBy || '').toLowerCase().includes(term);
        const matchesDesc = (prog.description || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesClient && !matchesCoach && !matchesDesc) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        const progStatus = prog.status || 'assigned';
        if (statusFilter === 'published') {
          if (!prog.isPublishedToClient && progStatus !== 'published_to_client') return false;
        } else if (progStatus !== statusFilter) {
          return false;
        }
      }

      if (coachFilter !== 'all') {
        const coach = (prog.assignedCoachName || prog.createdBy || '').toLowerCase();
        if (!coach.includes(coachFilter.toLowerCase())) return false;
      }

      if (clientFilter !== 'all') {
        const client = (prog.assignedToUserName || '').toLowerCase();
        if (!client.includes(clientFilter.toLowerCase())) return false;
      }

      if (levelFilter !== 'all') {
        if (prog.level !== levelFilter) return false;
      }

      return true;
    });
  }, [displayPrograms, searchTerm, statusFilter, coachFilter, clientFilter, levelFilter]);

  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<{ id: string; title: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [assignedCoachName, setAssignedCoachName] = useState('');

  // Exercise input
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState(4);
  const [exReps, setExReps] = useState('8-10');
  const [exMuscle, setExMuscle] = useState('Chest / Triceps');
  const [exercisesList, setExercisesList] = useState<any[]>([]);

  useEffect(() => {
    const handleProgramsUpdated = () => {
      onProgramsUpdated();
    };
    window.addEventListener('bxstrength_programs_updated', handleProgramsUpdated);
    return () => {
      window.removeEventListener('bxstrength_programs_updated', handleProgramsUpdated);
    };
  }, [onProgramsUpdated]);

  const toggleAuditLog = (progId: string) => {
    setOpenAuditLogs(prev => ({ ...prev, [progId]: !prev[progId] }));
  };

  const handleOpenCreate = () => {
    setEditingProgram(null);
    setTitle('');
    setDescription('');
    setLevel('Intermediate');
    setAssignedUserId('');
    setAssignedCoachName(availableCoachOptions[0] || 'Shaban Faridi');
    setExercisesList([]);
    setShowModal(true);
  };

  const handleOpenEdit = (prog: WorkoutProgram) => {
    setEditingProgram(prog);
    setTitle(prog.title);
    setDescription(prog.description || '');
    setLevel(prog.level || 'Intermediate');
    setAssignedUserId(prog.assignedToUserId || '');
    setAssignedCoachName(prog.assignedCoachName || (availableCoachOptions[0] || 'Shaban Faridi'));
    setExercisesList(prog.exercises ? [...prog.exercises] : []);
    setShowModal(true);
  };

  const handleAddExercise = () => {
    if (!exName.trim()) return;
    setExercisesList([
      ...exercisesList,
      {
        id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: exName.trim(),
        sets: Number(exSets) || 3,
        reps: exReps.trim() || '10-12',
        targetMuscle: exMuscle.trim() || 'General'
      }
    ]);
    setExName('');
  };

  const handleRemoveExercise = (exId: string) => {
    setExercisesList(prev => prev.filter(e => e.id !== exId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || exercisesList.length === 0) {
      onShowToast('Title and at least 1 exercise routine item are required.');
      return;
    }

    const assignedUser = clients.find((c) => c.id === assignedUserId);

    const savedProg = VelocityAPI.saveProgram({
      id: editingProgram ? editingProgram.id : undefined,
      title: title.trim(),
      description: description.trim(),
      level,
      durationWeeks: 4,
      assignedToUserId: assignedUser ? assignedUser.id : undefined,
      assignedToUserName: assignedUser ? assignedUser.name : undefined,
      assignedCoachName: assignedCoachName || undefined,
      exercises: exercisesList
    });

    if (assignedCoachName && assignedCoachName.trim()) {
      VelocityAPI.saveCoachAssignment({
        assignmentType: 'workout_program',
        referenceId: savedProg.id,
        title: title.trim(),
        description: description.trim() || `${level} Athletic Workout Routine`,
        instructions: `Review program structure, adjust exercise sets/reps if needed, and publish finalized routine to athlete.`,
        assignedCoachName: assignedCoachName.trim(),
        clientId: assignedUser?.id,
        clientName: assignedUser?.name || 'Assigned Client Athlete',
        serviceName: `${level.toUpperCase()} Workout Package`,
        assignedByName: currentUser?.name || 'Shaban Faridi',
        assignedByRole: 'Head Coach',
        dueDate: '4 Weeks Program Duration',
        priority: 'high',
        status: 'assigned',
        details: { level, exercisesCount: exercisesList.length }
      });
    }

    onShowToast(
      editingProgram
        ? `Successfully updated workout program "${title}"!`
        : `Created & assigned workout program "${title}"!`
    );

    setShowModal(false);
    onProgramsUpdated();
  };

  const handleDeleteTrigger = (id: string, progTitle: string) => {
    setDeletingProgram({ id, title: progTitle });
  };

  const confirmDelete = () => {
    if (deletingProgram) {
      VelocityAPI.deleteProgram(deletingProgram.id);
      onShowToast(`Deleted workout program "${deletingProgram.title}"`);
      setDeletingProgram(null);
      onProgramsUpdated();
    }
  };

  const handlePublishToClient = (prog: WorkoutProgram) => {
    VelocityAPI.publishProgramToClient(prog.id);
    onShowToast(`Workout program "${prog.title}" (v${(prog.version || 1) + 1}.0) published & synced to ${prog.assignedToUserName || 'Client Dashboard'}!`);
    onProgramsUpdated();
  };

  const openApprovalActionModal = (
    type: 'accept' | 'request_changes' | 'reject' | 'submit_review' | 'headcoach_approve',
    programId: string,
    programTitle: string
  ) => {
    setActionNotes('');
    setActionModal({ isOpen: true, type, programId, programTitle });
  };

  const executeApprovalAction = () => {
    if (!actionModal) return;
    const { type, programId, programTitle } = actionModal;

    if (type === 'accept') {
      VelocityAPI.acceptAssignment('program', programId, actionNotes);
      onShowToast(`Accepted assignment for "${programTitle}"`);
    } else if (type === 'reject') {
      VelocityAPI.rejectAssignment('program', programId, actionNotes || 'Assignment rejected by coach.');
      onShowToast(`Rejected assignment for "${programTitle}"`);
    } else if (type === 'request_changes') {
      VelocityAPI.requestChangesOnAssignment('program', programId, actionNotes || 'Requested revisions on program.');
      onShowToast(`Requested changes on "${programTitle}"`);
    } else if (type === 'submit_review') {
      VelocityAPI.submitForApproval('program', programId, actionNotes || 'Submitted for Head Coach review.');
      onShowToast(`Submitted "${programTitle}" for Head Coach approval`);
    } else if (type === 'headcoach_approve') {
      VelocityAPI.approveByHeadCoach('program', programId, actionNotes || 'Approved by Head Coach.');
      onShowToast(`Head Coach approved program "${programTitle}"`);
    }

    setActionModal(null);
    onProgramsUpdated();
  };

  const getStatusBadge = (prog: WorkoutProgram) => {
    const status = prog.status || 'assigned';
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
            <CheckCircle2 className="w-3 h-3 text-teal-400" /> Published to Client (v{prog.version || 1}.0)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#E52165]" />
            WORKOUT PROGRAM BUILDER & APPROVAL WORKFLOW
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Build routines, route assignments to coaches, review & approve plans, track complete audit logs, and publish live to clients.
          </p>
        </div>

        {isHeadCoachOrAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-[#8C532B] hover:bg-[#70401E] text-white text-xs font-black tracking-widest px-5 py-3 uppercase shadow-md shadow-amber-950/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>BUILD NEW WORKOUT PROGRAM</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search programs by title, client name, coach, or details..."
              className="w-full bg-[#18181b] border border-gray-700 text-white text-xs pl-10 pr-4 py-2.5 rounded placeholder-gray-500 focus:outline-none focus:border-[#8C532B]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#18181b] border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded focus:outline-none focus:border-[#8C532B]"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="coach_accepted">Coach Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="headcoach_review">Head Coach Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published to Client</option>
              <option value="change_requested">Change Requested</option>
            </select>

            {/* Coach Filter */}
            <select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              className="bg-[#18181b] border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded focus:outline-none focus:border-[#8C532B]"
            >
              <option value="all">All Coaches</option>
              {availableCoachOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-[#18181b] border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded focus:outline-none focus:border-[#8C532B]"
            >
              <option value="all">All Clients</option>
              {clients.map((cli) => (
                <option key={cli.id} value={cli.name}>{cli.name}</option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-[#18181b] border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded focus:outline-none focus:border-[#8C532B]"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || statusFilter !== 'all' || coachFilter !== 'all' || clientFilter !== 'all' || levelFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCoachFilter('all');
                  setClientFilter('all');
                  setLevelFilter('all');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded flex items-center gap-1.5 cursor-pointer border border-gray-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter & Summary */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800/60">
          <span className="font-medium">
            Showing <strong className="text-white font-bold">{filteredPrograms.length}</strong> of {displayPrograms.length} Workout Programs
          </span>
          {filteredPrograms.length === 0 && (
            <span className="text-amber-400 font-bold">No workout programs match your filter criteria.</span>
          )}
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrograms.map((prog) => {
          const isAuditOpen = !!openAuditLogs[prog.id];
          const isApprovedOrPublished = prog.status === 'approved' || prog.status === 'published_to_client' || prog.isPublishedToClient;
          const canPublish = isApprovedOrPublished || isAdmin;

          return (
            <div key={prog.id} className="bg-[#111111] border border-gray-800 p-5 flex flex-col justify-between hover:border-[#8C532B]/50 transition-all rounded-lg shadow-lg">
              <div>
                {/* Assignment Attribution Header */}
                <div className="bg-[#191610] border border-amber-800/40 p-2.5 mb-3 rounded flex flex-wrap items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Assigned by {prog.assignedBy || 'Shaban Faridi'} — {prog.assignedByRole || 'Head Coach'}</span>
                  </div>
                  <span className="text-[10px] text-amber-200/70 font-mono">
                    {new Date(prog.assignedAt || prog.createdAt).toLocaleDateString()} {new Date(prog.assignedAt || prog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-gray-800 text-pink-400 border border-gray-700 rounded">
                      {prog.level}
                    </span>
                    {prog.version && prog.version > 1 && (
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 border border-sky-800 rounded">
                        v{prog.version}.0
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {prog.assignedToUserName && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800 flex items-center gap-1 rounded">
                        <UserCheck className="w-3 h-3" /> Client: {prog.assignedToUserName}
                      </span>
                    )}

                    {prog.assignedCoachName && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 border border-amber-800 flex items-center gap-1 rounded">
                        <ShieldCheck className="w-3 h-3" /> Coach: {prog.assignedCoachName}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-black uppercase text-white mb-1">{prog.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{prog.description || 'Custom Athletic Workout Routine'}</p>

                {/* Status Pill Header */}
                <div className="mb-3">
                  {getStatusBadge(prog)}
                </div>

                <div className="bg-gray-900/90 p-3 border border-gray-800 space-y-1 text-xs rounded mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Exercise Routine Items ({prog.exercises ? prog.exercises.length : 0}):
                  </span>
                  {prog.exercises && prog.exercises.map((ex) => (
                    <div key={ex.id} className="flex justify-between text-gray-300 text-[11px]">
                      <span>• {ex.name} <span className="text-gray-500">({ex.targetMuscle})</span></span>
                      <span className="font-mono text-gray-400 font-bold">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                </div>

                {/* COACH APPROVAL ACTION BAR */}
                <div className="bg-gray-950 p-3 border border-gray-800 rounded space-y-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Coach & Head Coach Approval Actions:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action 1: Coach Accept / Request Changes / Reject */}
                    {(prog.status === 'assigned' || prog.status === 'change_requested' || !prog.status) && (
                      <>
                        <button
                          onClick={() => openApprovalActionModal('accept', prog.id, prog.title)}
                          className="bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept Assignment
                        </button>

                        <button
                          onClick={() => openApprovalActionModal('request_changes', prog.id, prog.title)}
                          className="bg-orange-950 hover:bg-orange-900 text-orange-300 border border-orange-800 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Request Changes
                        </button>

                        <button
                          onClick={() => openApprovalActionModal('reject', prog.id, prog.title)}
                          className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {/* Action 2: Coach Submit for Head Coach Review */}
                    {(prog.status === 'coach_accepted' || prog.status === 'in_progress') && (
                      <button
                        onClick={() => openApprovalActionModal('submit_review', prog.id, prog.title)}
                        className="bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700 text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit for Head Coach Review
                      </button>
                    )}

                    {/* Action 3: Head Coach / Admin Approval */}
                    {(prog.status === 'headcoach_review' || isHeadCoachOrAdmin) && prog.status !== 'approved' && prog.status !== 'published_to_client' && (
                      <button
                        onClick={() => openApprovalActionModal('headcoach_approve', prog.id, prog.title)}
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
                      {prog.isPublishedToClient
                        ? `Live on Client Dashboard (v${prog.version || 1}.0)`
                        : 'Hidden from Client Dashboard'}
                    </span>
                  </div>

                  {prog.isPublishedToClient ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 border border-emerald-800 flex items-center gap-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published {prog.publishedToClientAt ? `(${new Date(prog.publishedToClientAt).toLocaleDateString()})` : ''}
                      </span>

                      <button
                        onClick={() => handlePublishToClient(prog)}
                        className="bg-blue-900 hover:bg-blue-800 text-blue-200 text-[11px] font-bold px-2.5 py-1 uppercase rounded border border-blue-700 cursor-pointer"
                        title="Publish updated version to client"
                      >
                        Re-Publish Update
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePublishToClient(prog)}
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
                    onClick={() => toggleAuditLog(prog.id)}
                    className="w-full text-left bg-gray-900/60 hover:bg-gray-900 border border-gray-800 text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      Approval Audit Trail ({prog.approvalLogs ? prog.approvalLogs.length : 0} logs)
                    </span>
                    {isAuditOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isAuditOpen && (
                    <div className="mt-2 bg-black border border-gray-800 p-3 rounded space-y-2 text-xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-800 pb-1">
                        Internal Approval & Assignment History:
                      </span>
                      {(!prog.approvalLogs || prog.approvalLogs.length === 0) ? (
                        <p className="text-[11px] text-gray-500 italic">No approval logs recorded yet.</p>
                      ) : (
                        prog.approvalLogs.map((log) => (
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

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">
                  Created: {new Date(prog.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {isHeadCoachOrAdmin && (
                    <button
                      onClick={() => handleOpenEdit(prog)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 border border-blue-800/60 rounded transition-colors cursor-pointer"
                      title="Edit Workout Program"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Routine
                    </button>
                  )}

                  {isHeadCoachOrAdmin && (
                    <button
                      onClick={() => handleDeleteTrigger(prog.id, prog.title)}
                      className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 px-2.5 py-1 border border-red-800/60 rounded transition-colors cursor-pointer"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {displayPrograms.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500 border border-gray-800 bg-[#111111]">
            <Dumbbell className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="font-bold text-gray-400 uppercase text-xs">No workout programs found</p>
            <p className="text-[11px] text-gray-500 mt-1">Build custom programs and assign them to clients and coaches to view routines here.</p>
          </div>
        )}
      </div>

      {/* Approval Action Notes Modal */}
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
              Program: <strong className="text-white">{actionModal.programTitle}</strong>
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

      {/* Create / Edit Program Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl overflow-y-auto flex flex-col">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase text-white mb-4">
              {editingProgram ? `EDIT WORKOUT PROGRAM: ${editingProgram.title}` : 'BUILD NEW WORKOUT PROGRAM'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Program Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hypertrophy 4-Day Split"
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Target Client</label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-amber-400 mb-1">Assign Coach *</label>
                  <select
                    value={assignedCoachName}
                    onChange={(e) => setAssignedCoachName(e.target.value)}
                    className="w-full bg-gray-900 border border-amber-800/80 text-white px-2 py-2 text-xs outline-none cursor-pointer font-bold"
                  >
                    <option value="">-- Select Coach --</option>
                    {availableCoachOptions.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Description / Focus Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Routine focus, intensity guidelines, and goals..."
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-xs outline-none"
                />
              </div>

              {/* Add Exercise Subsection */}
              <div className="bg-gray-900 p-3.5 border border-gray-800 space-y-2.5 rounded">
                <span className="text-xs font-bold uppercase text-[#E52165] block">
                  Add / Edit Routine Exercises ({exercisesList.length}):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Exercise Name"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    className="col-span-2 bg-black border border-gray-800 text-white px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Target Muscle"
                    value={exMuscle}
                    onChange={(e) => setExMuscle(e.target.value)}
                    className="bg-black border border-gray-800 text-white px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span>Sets:</span>
                    <input
                      type="number"
                      value={exSets}
                      onChange={(e) => setExSets(Number(e.target.value))}
                      className="w-12 bg-black border border-gray-800 text-white px-1 py-1 text-xs font-mono"
                    />
                    <span>Reps:</span>
                    <input
                      type="text"
                      value={exReps}
                      onChange={(e) => setExReps(e.target.value)}
                      className="w-16 bg-black border border-gray-800 text-white px-1 py-1 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-xs font-bold px-3 py-1 uppercase border border-emerald-800 rounded transition-colors cursor-pointer"
                  >
                    + ADD EXERCISE
                  </button>
                </div>

                {exercisesList.length > 0 && (
                  <div className="pt-2 border-t border-gray-800 text-xs text-gray-300 space-y-1.5 max-h-40 overflow-y-auto">
                    {exercisesList.map((e, idx) => (
                      <div key={e.id || idx} className="flex items-center justify-between bg-black p-2 border border-gray-800 rounded text-[11px]">
                        <span>{idx + 1}. <strong className="text-white">{e.name}</strong> ({e.targetMuscle})</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-gray-400 font-bold">{e.sets}×{e.reps}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(e.id)}
                            className="text-red-400 hover:text-red-300 font-bold px-1"
                            title="Remove Exercise"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black tracking-widest py-3 uppercase shadow-md shadow-pink-500/20 cursor-pointer mt-2"
              >
                {editingProgram ? 'SAVE PROGRAM CHANGES' : 'SAVE & ASSIGN WORKOUT PROGRAM'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingProgram}
        title="DELETE WORKOUT PROGRAM"
        message={`Are you sure you want to permanently delete the workout routine "${deletingProgram?.title}"?`}
        type="danger"
        confirmText="DELETE ROUTINE"
        cancelText="KEEP ROUTINE"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingProgram(null)}
      />
    </div>
  );
};


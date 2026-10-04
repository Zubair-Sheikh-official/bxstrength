import { VelocityAPI } from '../api';

export const assignmentService = {
  fetchAssignments: (coachNameOrId?: string) => VelocityAPI.fetchCoachAssignments(coachNameOrId),
  getAssignments: (coachNameOrId?: string) => VelocityAPI.getCoachAssignments(coachNameOrId),
  saveAssignment: (asgnData: Parameters<typeof VelocityAPI.saveCoachAssignment>[0]) => VelocityAPI.saveCoachAssignment(asgnData),
  updateAssignmentStatus: (id: string, status: Parameters<typeof VelocityAPI.updateCoachAssignmentStatus>[1], notes?: string) => VelocityAPI.updateCoachAssignmentStatus(id, status, notes),
  deleteAssignment: (id: string) => VelocityAPI.deleteCoachAssignment(id)
};

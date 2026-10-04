import { VelocityAPI } from '../api';

export const workoutService = {
  fetchPrograms: (assignedUserId?: string) => VelocityAPI.fetchPrograms(assignedUserId),
  getPrograms: (assignedUserId?: string) => VelocityAPI.getPrograms(assignedUserId),
  saveProgram: (progData: Parameters<typeof VelocityAPI.saveProgram>[0]) => VelocityAPI.saveProgram(progData),
  updateProgramStatus: (id: string, status: Parameters<typeof VelocityAPI.updateProgramStatus>[1]) => VelocityAPI.updateProgramStatus(id, status)
};

import { VelocityAPI } from '../api';

export const nutritionService = {
  fetchNutritionPlans: (assignedUserId?: string) => VelocityAPI.fetchNutritionPlans(assignedUserId),
  getNutritionPlans: (assignedUserId?: string) => VelocityAPI.getNutritionPlans(assignedUserId),
  saveNutritionPlan: (planData: Parameters<typeof VelocityAPI.saveNutritionPlan>[0]) => VelocityAPI.saveNutritionPlan(planData),
  updateNutritionStatus: (id: string, status: Parameters<typeof VelocityAPI.updateNutritionStatus>[1]) => VelocityAPI.updateNutritionStatus(id, status)
};

import { VelocityAPI } from '../api';

export const userService = {
  fetchUsers: () => VelocityAPI.fetchUsers(),
  getUsers: () => VelocityAPI.getUsers(),
  createUser: (userData: Parameters<typeof VelocityAPI.createUser>[0]) => VelocityAPI.createUser(userData),
  updateUser: (id: string, updates: Parameters<typeof VelocityAPI.updateUser>[1]) => VelocityAPI.updateUser(id, updates)
};

import { VelocityAPI } from '../api';

export const ticketService = {
  getTickets: (userId?: string) => VelocityAPI.getTickets(userId),
  createTicket: (data: Parameters<typeof VelocityAPI.createTicket>[0]) => VelocityAPI.createTicket(data),
  updateTicketStatus: (id: string, status: Parameters<typeof VelocityAPI.updateTicketStatus>[1], responseMsg?: string) => VelocityAPI.updateTicketStatus(id, status, responseMsg),
  assignTicket: (id: string, agentName: string) => VelocityAPI.assignTicket(id, agentName),
  escalateTicket: (id: string, escalatedTo: string, reason: string) => VelocityAPI.escalateTicket(id, escalatedTo, reason)
};

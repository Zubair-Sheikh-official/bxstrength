import { VelocityAPI } from '../api';

export const enquiryService = {
  fetchEnquiries: () => VelocityAPI.fetchEnquiries(),
  getEnquiries: () => VelocityAPI.getEnquiries(),
  createEnquiry: (enquiry: Parameters<typeof VelocityAPI.createEnquiry>[0]) => VelocityAPI.createEnquiry(enquiry),
  updateEnquiryStatus: (id: string, status: Parameters<typeof VelocityAPI.updateEnquiryStatus>[1], response?: string) => VelocityAPI.updateEnquiryStatus(id, status, response)
};

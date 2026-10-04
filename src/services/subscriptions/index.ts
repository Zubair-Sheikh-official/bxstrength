import { VelocityAPI } from '../api';

export const subscriptionService = {
  fetchSubscriptions: () => VelocityAPI.fetchSubscriptions(),
  getSubscriptions: () => VelocityAPI.getSubscriptions(),
  createSubscription: (subData: Parameters<typeof VelocityAPI.createSubscription>[0]) => VelocityAPI.createSubscription(subData)
};

import { UserWithMetaInformationAndProject } from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getCurrentUser() {
    return api.get<UserWithMetaInformationAndProject>('/v1/users/me');
  },
  getCurrentUserAction(request: any) {
    return api.get<UserWithMetaInformationAndProject>(`/v1/users/me`, request);
  },
};

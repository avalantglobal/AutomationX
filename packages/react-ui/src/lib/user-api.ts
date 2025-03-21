import { UserWithMetaInformationAndProject } from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getCurrentUser() {
    return api.get<UserWithMetaInformationAndProject>('/v1/users/me');
  },
  setAccessTokenInDB() {
    let accessToken = localStorage.getItem("access_token");
    return api.post<void>('/v1/users/setAccessToken', {
      accessToken,
    });
  }
};

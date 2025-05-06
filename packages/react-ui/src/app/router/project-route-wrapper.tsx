import React, { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { determineDefaultRoute } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { LoadingScreen } from '../../components/ui/loading-screen';
import { authenticationSession } from '../../lib/authentication-session';
import { FloatingChatButton } from '@/components/custom/FloatingChatButton';
import { botxApi } from '../../components/lib/botx-api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userHooks } from '../../hooks/user-hooks';

export const TokenCheckerWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    isError,
    error,
    data: isProjectValid,
    projectIdFromParams,
    isLoading,
    isFetching,
  } = projectHooks.useSwitchToProjectInParams();
  const { checkAccess } = useAuthorization();
  const { data: user } = userHooks.useCurrentUser();
  const {
    // use this in your onClick
    data: botxToken,
    isSuccess,
    isError: isBotxJwtError,
    error: botxJwtError,
  } = useQuery({
    queryKey: ['user-botx-jwt', user?.email],
    queryFn: () =>
      botxApi.getSignBotxJwt({
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      }),
    enabled: !!user, // Run only when user data is available
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  if (isNil(projectIdFromParams) || isNil(projectIdFromParams)) {
    return <Navigate to="/sign-in" replace />;
  }
  useEffect(() => {
    // fetch botx Jwt to get the token that will be used requesting botxApi
    if (isSuccess && botxToken?.token) {
      authenticationSession.saveBotxToken(botxToken?.token);
    }
  }, [isSuccess, botxToken]);

  const failedToSwitchToProject =
    !isProjectValid && !isNil(projectIdFromParams);
  if (failedToSwitchToProject) {
    const defaultRoute = determineDefaultRoute(checkAccess);
    return <Navigate to={defaultRoute} replace />;
  }
  if (isError || !isProjectValid) {
    console.log({ isError, isProjectValid, error });
    return <Navigate to="/" replace />;
  }
  //TODO: after upgrading react, we should use (use) hook to trigger suspense instead of this
  if (isLoading || isFetching) {
    return <LoadingScreen></LoadingScreen>;
  }
  return <>{children}</>;
};

type RedirectToCurrentProjectRouteProps = {
  path: string;
  children: React.ReactNode;
};
const RedirectToCurrentProjectRoute: React.FC<
  RedirectToCurrentProjectRouteProps
> = ({ path }) => {
  const currentProjectId = authenticationSession.getProjectId();
  const params = useParams();
  const [searchParams] = useSearchParams();
  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }

  const pathWithParams = `${path.startsWith('/') ? path : `/${path}`}`.replace(
    /:(\w+)/g,
    (_, param) => params[param] ?? ''
  );

  const searchParamsString = searchParams.toString();
  const pathWithParamsAndSearchParams = `${pathWithParams}${
    searchParamsString ? `?${searchParamsString}` : ''
  }`;

  return (
    <Navigate
      to={`/projects/${currentProjectId}${pathWithParamsAndSearchParams}`}
      replace
    />
  );
};

interface ProjectRouterWrapperProps {
  path: string;
  element: React.ReactNode;
}

export const ProjectRouterWrapper = ({
  element,
  path,
}: ProjectRouterWrapperProps) => [
  {
    path: `/projects/:projectId${path.startsWith('/') ? path : `/${path}`}`,
    element: (
      <TokenCheckerWrapper>
        {' '}
        {element}
        <FloatingChatButton />{' '}
      </TokenCheckerWrapper>
    ),
  },
  {
    path,
    element: (
      <RedirectToCurrentProjectRoute path={path}>
        {element}
        <FloatingChatButton />
      </RedirectToCurrentProjectRoute>
    ),
  },
];

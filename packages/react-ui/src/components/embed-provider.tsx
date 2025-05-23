import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, isNil } from '@activepieces/shared';

type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix: string;
  hideLogoInBuilder: boolean;
  disableNavigationInBuilder: boolean;
  hideFolders: boolean;
  hideFlowNameInBuilder: boolean;
  hideExportAndImportFlow: boolean;
  sdkVersion?: string;
  predefinedConnectionName?: string;
  fontUrl?: string;
  fontFamily?: string;
  useDarkBackground: boolean;
  hideHomeButtonInBuilder: boolean;
  emitHomeButtonClickedEvent: boolean;
  externalLoginUrl: string | null;
  enableChatBot: boolean;
};

const defaultState: EmbeddingState = {
  isEmbedded: false,
  hideSideNav: false,
  hideLogoInBuilder: false,
  prefix: '',
  disableNavigationInBuilder: false,
  hideFolders: false,
  hideFlowNameInBuilder: false,
  hideExportAndImportFlow: false,
  useDarkBackground: window.opener !== null,
  hideHomeButtonInBuilder: false,
  emitHomeButtonClickedEvent: false,
  externalLoginUrl: null,
  enableChatBot: true,
};

const EmbeddingContext = createContext<{
  embedState: EmbeddingState;
  setEmbedState: React.Dispatch<React.SetStateAction<EmbeddingState>>;
}>({
  embedState: defaultState,
  setEmbedState: () => {},
});

export const useEmbedding = () => useContext(EmbeddingContext);
export const useNewWindow = () => {
  const { embedState } = useEmbedding();
  const navigate = useNavigate();
  if (embedState.isEmbedded) {
    return (route: string, searchParams?: string) =>
      navigate({
        pathname: route,
        search: searchParams,
      });
  } else {
    return (route: string, searchParams?: string) =>
      window.open(
        `${route}${searchParams ? '?' + searchParams : ''}`,
        '_blank',
        'noopener noreferrer'
      );
  }
};
type EmbeddingProviderProps = {
  children: React.ReactNode;
};

const EmbeddingProvider = ({ children }: EmbeddingProviderProps) => {
  const [state, setState] = useState<EmbeddingState>(defaultState);

  const { data: loginUrl } = flagsHooks.useFlag<string>(ApFlagId.LOGIN_URL);
  const { data: botxUrl } = flagsHooks.useFlag<string>(ApFlagId.BOTX_URL);
  useEffect(() => {
    const externalLoginUrl = loginUrl?.trim() || null;
    const enableChatBot = !!botxUrl?.trim();

    setState({
      ...defaultState,
      externalLoginUrl,
      enableChatBot,
    });
  }, [loginUrl, botxUrl]);

  return (
    <EmbeddingContext.Provider
      value={{ embedState: state, setEmbedState: setState }}
    >
      <div
        className={cn({
          'bg-black/80 h-screen w-screen': state.useDarkBackground,
        })}
      >
        {children}
      </div>
    </EmbeddingContext.Provider>
  );
};

EmbeddingProvider.displayName = 'EmbeddingProvider';

export { EmbeddingProvider };

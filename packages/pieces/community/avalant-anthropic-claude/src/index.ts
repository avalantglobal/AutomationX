import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { askClaude } from './lib/actions/ask-claude';
import {
  baseUrlMap,
  getAccessToken,
  getClaudeApiKey,
  getUserProfile,
  Production,
  Test,
} from './lib/common/common';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const promptxAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown({
      displayName: 'Server',
      options: {
        options: [
          {
            label: Production,
            value: Production,
          },
          {
            label: Test,
            value: Test,
          },
        ],
      },
      required: true,
      defaultValue: Production,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { username, password } = auth;
    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty Username or Password',
      };
    }
    const response = await fetch(baseUrlMap[auth.server]['loginUrl'], {
      method: 'POST',
      body: new URLSearchParams({
        username: username,
        password: password,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    if (response.status === 200) {
      return {
        valid: true,
      };
    } else {
      const data = await response.json();
      return {
        valid: false,
        error: data?.error || data?.message,
      };
    }
  },
});
export const avalantAnthropicClaude = createPiece({
  displayName: 'Avalant-anthropic-claude',
  auth: promptxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/avalant-anthropic-claude.png',
  authors: [],
  actions: [
    askClaude,
    extractStructuredDataAction,
    createCustomApiCallAction({
      auth: promptxAuth,
      baseUrl: () => 'https://example.com',
      authMapping: async (auth: any) => {
        const accessToken = await getAccessToken(
          auth?.server,
          auth?.username,
          auth?.password
        );
        let apiKey = getClaudeApiKey();
        console.log('apiKey ', apiKey);
        return {
          'x-api-key': `${apiKey}`,
        };
      },
    }),
  ],
  triggers: [],
});

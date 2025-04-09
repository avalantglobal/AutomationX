import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  HttpRequest,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { outlookEmailAuth } from '../..';

export const newEmailTrigger = createTrigger({
  auth: outlookEmailAuth,
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'new-email',
  displayName: 'New Email',
  description: 'Trigger when new emmail is found in outlook mail box',
  props: {},
  sampleData: {
    id: 'email-id',
    subject: 'New email subject',
    sender: { emailAddress: { address: 'sender@example.com' } },
    receivedDateTime: '2024-03-20T10:00:00Z',
    bodyPreview: 'This is a preview of the email...',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
  },
  async onDisable(context) {
    return;
  },
  async test(context) {
    const { auth } = context;
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages',
      body: {},
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body.value;
  },

  async run(context) {
    const { auth, store } = context;
    const lastPollTime = (await store.get('lastPoll')) ?? 0; // Get last checked time
    const access_token = auth.access_token;
    // Fetch latest emails
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      queryParams: { $top: '5', $orderby: 'receivedDateTime DESC' },
    });

    const emails = response.body.value;
    const newEmails = emails.filter(
      (email: any) => email.receivedDateTime > lastPollTime
    );
    // Store latest email time if new emails are found
    if (newEmails.length > 0) {
      await store.put('lastPoll', newEmails[0].receivedDateTime);
      return newEmails; // Return new emails to trigger the event
    }

    return []; // No new emails
  },
});

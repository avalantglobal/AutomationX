import { createTrigger, TriggerStrategy, Property, PieceAuth, WebhookHandshakeStrategy } from '@activepieces/pieces-framework';
import { FacebookWebhookPayload, MessagingEvent } from '../common/facebook-messenger-types';

const markdown = `
##  Facebook Messenger Webhook Setup

1. Go to your Facebook Developer account and navigate to your app
2. Add the "Messenger" product if you haven't already
3. Under Webhooks, click "Add Callback URL"
4. In the webhook settings, paste this URL: \n
    **\`{{webhookUrl}}\\\sync\`** \n
5. Set a Verify Token (can be any string you choose)
6. Publish your Activepieces flow first then click "Verify and save" button in Facebook
7. Select the subscription fields: 'messages', 'messaging_postbacks'
8. Generate a Page Access Token to use later in the actions.
`;

export const newMessage = createTrigger({
    name: 'new-message',
    displayName: 'New Message',
    description: 'Triggers when a new message is received in Facebook Messenger',
    auth: PieceAuth.None(),
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
        verify_token: Property.ShortText({
            displayName: 'Verify Token',
            description: 'The verification token you set in the Facebook webhook settings',
            required: true,
        }),
    },
    sampleData: {
        object: 'page',
        entry: [
            {
                id: '12345678',
                time: 1677825199103,
                messaging: [
                    {
                        sender: { id: '1234567890' },
                        recipient: { id: '0987654321' },
                        timestamp: 1677825198832,
                        message: {
                            mid: 'mid.$cAAJsODHV7jRqnxuYglm4lMdx4Qy-',
                            text: 'Hello world!'
                        }
                    }
                ]
            }
        ]
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // Facebook doesn't require any API calls to enable webhooks
        // The webhook is enabled when it's verified through the handshake
    },
    async onDisable(context) {
        // No specific deletion needed for Facebook webhooks
    },
    handshakeConfiguration: {
        strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
        paramName: 'hub.challenge',
    },
    async onHandshake(context) {
        const payload = context.payload;
        
        // Get verification parameters from Facebook
        const mode = payload.queryParams['hub.mode'];
        const token = payload.queryParams['hub.verify_token'];
        const challenge = payload.queryParams['hub.challenge'];
        
        // Verify the token against the one provided in the trigger props
        if (mode === 'subscribe' && token === context.propsValue.verify_token) {
            return {
                status: 200,
                body: challenge,
                headers: { "Content-Type": "text/plain" }
            };
        } else {
            return {
                status: 403,
                body: 'Verification failed',
                headers: { "Content-Type": "text/plain" }
            };
        }
    },
    async run(context) {
        const body = context.payload.body as FacebookWebhookPayload;
        if (!body || body.object !== 'page') {
            return [];
        }
        
        const messages = [];
        
        try {
            // Process each entry and messaging event
            for (const entry of body.entry) {
                if (entry.messaging) {
                    for (const messagingEvent of entry.messaging) {
                        if (messagingEvent.message) {
                            messages.push({
                                sender: messagingEvent.sender,
                                recipient: messagingEvent.recipient,
                                timestamp: messagingEvent.timestamp,
                                message: messagingEvent.message
                            });
                        }
                    }
                }
            }
            
            return messages;
        } catch (error) {
            console.error('Error processing Facebook messages:', error);
            return [];
        }
    }
});

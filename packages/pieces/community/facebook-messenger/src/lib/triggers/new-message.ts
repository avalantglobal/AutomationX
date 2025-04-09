
import { createTrigger, TriggerStrategy,Property ,PieceAuth} from '@activepieces/pieces-framework';
const markdown = `
- In the webhook settings, paste this URL: 
  \`{{webhookUrl}}\`
- Publish Activepieces flow first then click "Verify" button
`;
export const new_message = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'new-message',
    displayName: 'new-message',
    description: 'Trigger flow by new message',
    auth:PieceAuth.None(),
    props: {
        md: Property.MarkDown({
          value: markdown,
        }),
      },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        // implement webhook creation logic
    },
    async onDisable(context){
        // implement webhook deletion logic
    },
    async run(context){
      const { events } = context.payload.body as { events: unknown[] };
      if (!events) {
        return [];
      }
      return events.filter(
        (event: any) => event.mode === 'active' && event.type === 'message'
      );
    }
})
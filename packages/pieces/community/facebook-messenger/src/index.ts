
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { PieceCategory } from '@activepieces/shared';
    import { new_message } from "./lib/triggers/new-message";
    import crypto from 'node:crypto';
    export const FBAuth = PieceAuth.SecretText({
      displayName: 'Access Token',
      required: true,
    });

    export const facebookMessenger = createPiece({
      displayName: "Facebook-messenger",
      description: 'Manage your Facebook Chat',
      auth: FBAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/facebook.png",
      categories: [PieceCategory.COMMUNICATION],
      authors: ["tumrabert"],
      actions: [],
      triggers: [new_message],
    });
    
import { PropertyType } from '@activepieces/pieces-framework'
import {
    AppConnectionType,
    CloudOAuth2ConnectionValue,
    isNil,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { domainHelper } from '../../../../helper/domain-helper'
import { globalOAuthAppService } from '../../../../oauth-apps/global-oauth-app.service'
import { pieceMetadataService } from '../../../../pieces/piece-metadata-service'
import { ClaimOAuth2Request, RefreshOAuth2Request } from '../oauth2-service'
import { credentialsOauth2Service } from './credentials-oauth2-service'

export const globalOAuth2Service = (log: FastifyBaseLogger) => ({
    claim: async ({
        request,
        pieceName,
        platformId,
        projectId,
    }: ClaimOAuth2Request): Promise<CloudOAuth2ConnectionValue> => {
        const { auth } = await pieceMetadataService(log).getOrThrow({
            name: pieceName,
            version: undefined,
            projectId,
            platformId,
        })
        if (isNil(auth) || auth.type !== PropertyType.OAUTH2) {
            throw new Error(
                'Cannot claim auth for non oauth2 property ' +
                auth?.type +
                ' ' +
                pieceName,
            )
        }
        const oauth2App = await globalOAuthAppService.getWithSecret({ pieceName, clientId: request.clientId })
        const claimedValue = await credentialsOauth2Service(log).claim({
            request: {
                ...request,
                clientId: oauth2App.clientId,
                clientSecret: oauth2App.clientSecret,
                redirectUrl: await domainHelper.getInternalUrl({ path: '/redirect' }),
            },
            projectId,
            platformId,
            pieceName,
        })
        return {
            ...claimedValue,
            type: AppConnectionType.CLOUD_OAUTH2,
        }
    },
    refresh: async ({
        pieceName,
        projectId,
        platformId,
        connectionValue,
    }: RefreshOAuth2Request<CloudOAuth2ConnectionValue>): Promise<CloudOAuth2ConnectionValue> => {
        const oauth2App = await globalOAuthAppService.getWithSecret({ pieceName, clientId: connectionValue.client_id })
        const newValue = await credentialsOauth2Service(log).refresh({
            pieceName,
            projectId,
            platformId,
            connectionValue: {
                ...connectionValue,
                type: AppConnectionType.OAUTH2,
                redirect_url: await domainHelper.getInternalUrl({ path: '/redirect' }),
                client_secret: oauth2App.clientSecret,
            },
        })
        return {
            expires_in: newValue.expires_in,
            client_id: newValue.client_id,
            token_type: newValue.token_type,
            access_token: newValue.access_token,
            claimed_at: newValue.claimed_at,
            refresh_token: newValue.refresh_token,
            scope: newValue.scope,
            token_url: newValue.token_url,
            data: newValue.data,
            props: newValue.props,
            authorization_method: newValue.authorization_method,
            type: AppConnectionType.CLOUD_OAUTH2,
        }
    },
})

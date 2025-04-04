// import { ApplicationEventName } from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    assertNotNullOrUndefined,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    SignInRequest,
    SignOutRequest,
    SignUpRequest,
    SwitchPlatformRequest,
    SwitchProjectRequest,
    Trigger,
    UserIdentityProvider,
} from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
// import { eventsHooks } from '../helper/application-events'
import dayjs from 'dayjs'
import { distributedStore } from '../helper/keyvalue'
import { system } from '../helper/system/system'
import { platformUtils } from '../platform/platform.utils'
import { userService } from '../user/user-service'
import { authenticationService } from './authentication.service'
import { flowService } from '../flows/flow/flow.service'

export const authenticationController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {

        const platformId = await platformUtils.getPlatformIdForRequest(request)
        const signUpResponse = await authenticationService(request.log).signUp({
            ...request.body,
            provider: UserIdentityProvider.EMAIL,
            platformId: platformId ?? null,
        })

        // eventsHooks.get(request.log).sendUserEvent({
        //     platformId: signUpResponse.platformId!,
        //     userId: signUpResponse.id,
        //     projectId: signUpResponse.projectId,
        //     ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        // }, {
        //     action: ApplicationEventName.USER_SIGNED_UP,
        //     data: {
        //         source: 'credentials',
        //     },
        // })

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {

        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const response = await authenticationService(request.log).signInWithPassword({
            email: request.body.email,
            password: request.body.password,
            predefinedPlatformId,
        })

        const responsePlatformId = response.platformId
        assertNotNullOrUndefined(responsePlatformId, 'Platform ID is required')
        const responseUserId = response.id;
        const responseProjectId = response.projectId;
        // eventsHooks.get(request.log).sendUserEvent({
        //     platformId: responsePlatformId,
        //     userId: response.id,
        //     projectId: response.projectId,
        //     ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        // }, {
        //     action: ApplicationEventName.USER_SIGNED_IN,
        //     data: {},
        // })

        let responseReturn: any = response;
        if (request.body.action == "newFlow") {
            const requestNewFlow = {
                projectId: responseProjectId,
                displayName: "Untitled",
            }
            const newFlow: any = await flowService(request.log).create({
                projectId: responseProjectId,
                request: requestNewFlow,
            })
            responseReturn = {
                ...responseReturn,
                flowId: newFlow.id,
            }
        }
        else if (request.body.action == "useTemplate") {
            const requestNewFlow = {
                projectId: responseProjectId,
                displayName: "Untitled",
            }
            const newFlow: any = await flowService(request.log).create({
                projectId: responseProjectId,
                request: requestNewFlow,
            })

            let flowTemplate: any = {};
            let templateId: string = request.body.templateId || '';
            const responseTemplate = await fetch('https://cloud.activepieces.com/api/v1/flow-templates', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const responseTemplateJson = await responseTemplate.json()
            const templates = responseTemplateJson.data;
            templates.map((template: any) => {
                if (template.id == templateId) {
                    flowTemplate = template.template;
                }
            })

            let requestUpdataFlow: FlowOperationRequest = {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                    displayName: flowTemplate.displayName,
                    trigger: flowTemplate.trigger,
                }
            }
            const updatedFlow = await flowService(request.log).update({
                id: newFlow.id,
                userId: responseUserId,
                platformId: responsePlatformId,
                projectId: responseProjectId,
                operation: cleanOperation(requestUpdataFlow),
            })
            responseReturn = {
                ...responseReturn,
                flowId: newFlow.id,
            }
        }

        return responseReturn
    })

    app.post('/sign-out', SignOutRequestOptions, async (request) => {
        const jwt = request.body.token
        const expiresIn = dayjs.duration(7, 'day').asSeconds()
        // Note that the key expiry is set as same as JWT expiry (7 days)
        await distributedStore().put(`revoked:${jwt}`, 1, expiresIn)
    })

    app.post('/switch-platform', SwitchPlatformRequestOptions, async (request) => {
        const user = await userService.getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchPlatform({
            identityId: user.identityId,
            platformId: request.body.platformId,
        })
    })

    app.post('/switch-project', SwitchProjectRequestOptions, async (request) => {
        const user = await userService.getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchProject({
            identityId: user.identityId,
            projectId: request.body.projectId,
            currentPlatformId: request.principal.platform.id,
        })
    })
}

function cleanOperation(operation: FlowOperationRequest): FlowOperationRequest {
    if (operation.type === FlowOperationType.IMPORT_FLOW) {
        const clearInputUiInfo = {
            currentSelectedData: undefined,
            sampleDataFileId: undefined,
            sampleDataInputFileId: undefined,
            lastTestDate: undefined,
        }
        const trigger = flowStructureUtil.transferStep(operation.request.trigger, (step) => {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    inputUiInfo: {
                        ...step.settings.inputUiInfo,
                        ...clearInputUiInfo,
                    },
                },
            }
        }) as Trigger
        return {
            ...operation,
            request: {
                ...operation.request,
                trigger: {
                    ...trigger,
                    settings: {
                        ...trigger.settings,
                        inputUiInfo: {
                            ...trigger.settings.inputUiInfo,
                            ...clearInputUiInfo,
                        },
                    },
                },
            },
        }
    }
    return operation
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const SwitchProjectRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchProjectRequest,
    },
}

const SwitchPlatformRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchPlatformRequest,
    },
}

const SignUpRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignInRequest,
    },
}

const SignOutRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignOutRequest,
    },
}

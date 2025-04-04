import { assertNotNullOrUndefined, FlowOperationRequest, FlowOperationType, flowStructureUtil, PrincipalType, Trigger, UserWithMetaInformationAndProject } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userService } from './user-service'
import { flowService } from '../flows/flow/flow.service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/me', GetCurrentUserRequest, async (req): Promise<UserWithMetaInformationAndProject> => {
        const userId = req.principal.id
        assertNotNullOrUndefined(userId, 'userId')

        const user = await userService.getMetaInformation({ id: userId })

        let flowId = "";
        let query: any = req.query;
        if (query.action == "newFlow") {
            const requestNewFlow = {
                projectId: req.principal.projectId,
                displayName: "Untitled",
            }
            const newFlow: any = await flowService(req.log).create({
                projectId: req.principal.projectId,
                request: requestNewFlow,
            })
            flowId = newFlow.id;
        }
        else if (query.action == "useTemplate") {
            const requestNewFlow = {
                projectId: req.principal.projectId,
                displayName: "Untitled",
            }
            const newFlow: any = await flowService(req.log).create({
                projectId: req.principal.projectId,
                request: requestNewFlow,
            })

            let flowTemplate: any = {};
            let templateId: string = query.templateId || '';
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
            const updatedFlow = await flowService(req.log).update({
                id: newFlow.id,
                userId: user.id,
                platformId: user.platformId || '',
                projectId: req.principal.projectId,
                operation: cleanOperation(requestUpdataFlow),
            })
            flowId = newFlow.id;
        }

        return {
            id: user.id,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
            platformId: user.platformId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            trackEvents: false,
            newsLetter: false,
            verified: true,
            projectId: req.principal.projectId,
            identityId: user.identityId!,
            flowId: flowId,
        }
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

const GetCurrentUserRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: UserWithMetaInformationAndProject,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
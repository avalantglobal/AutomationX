import { AnalyticsResponse, GetAnalyticsParams, OverviewResponse } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { analyticsService, overViewService} from './analytics-service'
import { projectService } from '../project/project-service' 
const ErrorResponse = {
    type: 'object',
    properties: {
        message: { type: 'string' },
    },
}
const AnalyticsRequest = {
    config: {},
    schema: {
        tags: ['analytics'],
        description: 'Get analytics data for flow-runs',
        querystring: GetAnalyticsParams,
        response: {
            [StatusCodes.OK]: AnalyticsResponse,
            [StatusCodes.BAD_REQUEST]: ErrorResponse,
            [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorResponse,
        },
    },
}
const OverviewRequest = {
    config: {},
    schema: {
        tags: ['analytics'],
        description: 'Get workflow overview statistics',
        response: {
            [StatusCodes.OK]: OverviewResponse,
            [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorResponse,
        },
    },
}
async function queryProjectEntity(platformId: string, userId: string ): Promise<string[]> {
    const result = await projectService.getAllForUser({ 
        platformId, 
        userId,
    })
    const projectIds = result
        .map(project => project.id)
    return projectIds
}

export const analyticsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/flow-performance/all', AnalyticsRequest, async (request, reply) => {
        try {
            const { startDate, endDate } = request.query
            // Convert timestamps to Date objects for comparison
            const start = new Date(startDate)
            const end = new Date(endDate)
            const currentDateTime = new Date()

            // Validate timestamps
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Invalid date format. Please provide valid dates.',
                })
            }

            // Validate date range
            if (start.getTime() >= end.getTime()) {
                return await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'startDate must be less than endDate',
                })
            }

            // Validate future dates
            if (start.getTime() > currentDateTime.getTime() || end.getTime() > currentDateTime.getTime()) {
                return await reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Dates cannot be in the future',
                })
            }
            //query project ids by platformId and userId
            const projectIds: string[] = await queryProjectEntity(request.principal.platform.id, request.principal.id)
            const analyticsData = await analyticsService.getAnalyticsData({
                startDate,
                endDate,
                projectIds,
            })

            return await reply.send(analyticsData)
        }
        catch (error) {
            app.log.error('Error fetching analytics data:', error)
            return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: 'An error occurred while fetching analytics data\n' + error,
            })
        }
    })
    app.get('/overview', OverviewRequest, async (request, reply) => {
        try {
            const projectIds: string[] = await queryProjectEntity(request.principal.platform.id, request.principal.id) 
            const response = await overViewService.getOverview(projectIds)
            return await reply.send(response)
        }
        catch (error) {
            app.log.error('Error fetching workflow overview:', error)
            return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: 'An error occurred while fetching analytics data\n' + error,
            })
        }
    })
}

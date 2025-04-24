import { AnalyticsResponseSchema, FlowStatus, GetAnalyticsParams, OverviewResponseSchema } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { analyticsService } from './analytics-service'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import 'tslib'
import jwt from 'jsonwebtoken'
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
            [StatusCodes.OK]: AnalyticsResponseSchema,
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
            [StatusCodes.OK]: OverviewResponseSchema,
            [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorResponse,
        },
    },
}

const _decodeJwt = (token: string): string => {
    try {
        // Decode the JWT without verifying the signature
        const decoded = jwt.decode(token) as { projectId: string, platform: { id: string } }

        if (decoded && decoded.projectId) {
            return decoded.projectId
        }
        else {
            throw new Error('Failed to decode JWT or missing projectId')
        }
    }
    catch (error) {
        console.error('Error decoding JWT:', error)
        throw new Error('Invalid JWT token')
    }
}



export const analyticsController: FastifyPluginAsyncTypebox = async (app: FastifyInstance) => {
    app.get('/workflow-performance',
        AnalyticsRequest,
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                
                const { startDate, endDate } = request.query as GetAnalyticsParams

                // Extract the token from the Authorization header
                const authHeader = request.headers.authorization

                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return await reply.status(StatusCodes.UNAUTHORIZED).send({
                        message: 'Authorization token is missing or invalid',
                    })
                }
                const token = authHeader.split(' ')[1] // Extract the token part
                
                const projectId = _decodeJwt(token)
                
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

                const analyticsData = await analyticsService.getAnalyticsData({
                    startDate,
                    endDate,
                    projectId,
                })

                return await reply.send(analyticsData)
            }
            catch (error) {
                app.log.error('Error fetching analytics data:', error)
                return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                    message: 'An error occurred while fetching analytics data',
                })
            }
        },
    ),
    app.get('/overview', OverviewRequest, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Extract the token from the Authorization header
            const authHeader = request.headers.authorization

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return await reply.status(StatusCodes.UNAUTHORIZED).send({
                    message: 'Authorization token is missing or invalid',
                })
            }

            const token = authHeader.split(' ')[1] // Extract the token part
            const projectId = _decodeJwt(token)
            const overviewData = await analyticsService.getWorkflowOverview(projectId)
            return await reply.send(overviewData)
        }
        catch (error) {
            app.log.error('Error fetching workflow overview:', error)
            return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: 'An error occurred while fetching analytics data',
            })
        }
    })
}


   
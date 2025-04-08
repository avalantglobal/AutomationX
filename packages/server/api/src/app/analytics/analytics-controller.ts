import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { analyticsService } from './analytics-service'

export const analyticsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            schema: {
                tags: ['analytics'],
                description: 'Get analytics data for flow-runs',
                querystring: Type.Object({
                    startTimestamp: Type.String({ format: 'date-time' }),
                    endTimestamp: Type.String({ format: 'date-time' }),
                }),
                response: {
                    [StatusCodes.OK]: Type.Record(
                        Type.String(), // flowId as string key
                        Type.Object({
                            averageRuntime: Type.Number(),
                            flowRunCount: Type.Number(),
                            successRate: Type.Number(),
                            failureRate: Type.Number(),
                        }),
                    ),
                },
            },
        },
        async (request, reply) => {
            const { startTimestamp, endTimestamp } = request.query as {
                startTimestamp: string
                endTimestamp: string
            }

            const analyticsData = await analyticsService.getAnalyticsData({
                startTimestamp: new Date(startTimestamp),
                endTimestamp: new Date(endTimestamp),
            })

            await reply.send(analyticsData)
        },
    )
}
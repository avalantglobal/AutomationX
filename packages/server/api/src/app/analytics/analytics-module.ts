import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import { analyticsController } from './analytics-controller'

export const analyticsModule: FastifyPluginAsync = async (app: FastifyInstance) => {
    await app.register(analyticsController, { prefix: '/v1/analytics' })
}

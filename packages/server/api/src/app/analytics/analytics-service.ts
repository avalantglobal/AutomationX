import { FlowRunStatus } from '@activepieces/shared'
import { Between } from 'typeorm'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'

type AnalyticsResultMap = Record<string, AnalyticsResult>

export const analyticsService = {
    async getAnalyticsData({
        startTimestamp,
        endTimestamp,
    }: GetAnalyticsParams): Promise<AnalyticsResultMap> {
        const flowRuns = await flowRunRepo().find({
            where: {
                finishTime: Between(
                    startTimestamp.toISOString(),
                    endTimestamp.toISOString(),
                ),
            },
        })

        const analytics: AnalyticsResultMap = {}

        for (const flowRun of flowRuns) {
            const flowId = flowRun.flowId

            if (!analytics[flowId]) {
                analytics[flowId] = {
                    averageRuntime: 0,
                    flowRunCount: 0,
                    successRate: 0,
                    failureRate: 0,
                }
            }

            analytics[flowId].flowRunCount += 1
            analytics[flowId].averageRuntime += flowRun.duration || 0
            analytics[flowId].successRate += flowRun.status === FlowRunStatus.SUCCEEDED ? 1 : 0
            analytics[flowId].failureRate += flowRun.status === FlowRunStatus.FAILED ? 1 : 0
        }

        for (const flowId of Object.keys(analytics)) {
            const data = analytics[flowId]
            data.averageRuntime = data.flowRunCount
                ? data.averageRuntime / data.flowRunCount
                : 0
            data.successRate = (data.successRate / data.flowRunCount) * 100
            data.failureRate = (data.failureRate / data.flowRunCount) * 100
        }

        return analytics
    },
}

type GetAnalyticsParams = {
    startTimestamp: Date
    endTimestamp: Date
}

type AnalyticsResult = {
    averageRuntime: number
    flowRunCount: number
    successRate: number
    failureRate: number
}

export type { AnalyticsResultMap }

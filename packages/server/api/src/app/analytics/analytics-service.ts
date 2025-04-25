import { AnalyticsResult, FlowRunStatus, FlowStatus, OverviewResult } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import dayjs from 'dayjs'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import 'tslib'


export const GetAnalyticsDataParams = Type.Object({
    startDate: Type.String({ format: 'date-time' }),
    endDate: Type.String({ format: 'date-time' }),
    projectId: Type.String(),
})
export const analyticsService = {
    async getAnalyticsData(params: Static<typeof GetAnalyticsDataParams>): Promise<AnalyticsResult[]> {
        const { startDate, endDate, projectId } = params

        const query = flowRunRepo()
            .createQueryBuilder('flowRun')
            .select('DATE(flowRun.finishTime)', 'date')
            .addSelect('COUNT(*)', 'totalFlowRuns')
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN 1 ELSE 0 END)',
                'successfulFlowRuns',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN 1 ELSE 0 END)',
                'failedFlowRuns',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN flowRun.duration ELSE 0 END)',
                'successfulFlowRunsDuration',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN flowRun.duration ELSE 0 END)',
                'failedFlowRunsDuration',
            )
            .where('DATE(flowRun.finishTime) BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .andWhere('flowRun.projectId = :projectId', { projectId })
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
            })
            .groupBy('DATE(flowRun.finishTime)')
            .orderBy('date', 'ASC')

        const rawResults = await query.getRawMany()
        
        const results: AnalyticsResult[] = rawResults.map(result => ({
            date: result.date,
            successfulFlowRuns: result.successfulFlowRuns,
            failedFlowRuns: result.failedFlowRuns,
            successfulFlowRunsDuration: result.successfulFlowRunsDuration,
            failedFlowRunsDuration: result.failedFlowRunsDuration,
        }))

        return results
    },
    async getWorkflowOverview(projectId: string): Promise<OverviewResult> {
        const { start, end } = {
            start: dayjs().startOf('month').toISOString(),
            end: dayjs().endOf('month').toISOString(),
        }

        const result = await flowRepo()
            .createQueryBuilder('flow')
            .select('COUNT(flow.id)', 'workflowCount')
            .addSelect(
                'SUM(CASE WHEN flow.status = :enabledStatus AND flow.projectId = :projectId THEN 1 ELSE 0 END)',
                'activeWorkflowCount',
            )
            .addSelect(
                `(SELECT COUNT(*) FROM flow_run flowRun 
                  WHERE flowRun.projectId = :projectId 
                  AND flowRun.finishTime BETWEEN :start AND :end)`,
                'flowRunCount',
            )
            .where('flow.projectId = :projectId', { projectId })
            .setParameters({ enabledStatus: FlowStatus.ENABLED, start, end })
            .getRawOne()

        
        return {
            workflowCount: result.workflowCount,
            activeWorkflowCount: result.activeWorkflowCount,
            flowRunCount: result.flowRunCount,
        }
    },
}


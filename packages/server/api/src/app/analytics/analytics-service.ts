import { AnalyticsResponse, FlowRunStatus, FlowStatus, OverviewResponse, 
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { projectService } from '../project/project-service' // Import projectService

type GetAnalyticsDataParams = {
    startDate: string
    endDate: string
    projectIds: string[]
}



export async function queryProjectEntity(platformId: string, userId: string ): Promise<string[]> {
    const result = await projectService.getAllForUser({ 
        platformId, 
        userId, // Replace with actual userId
    })

    const projectIds = result
        .map(project => project.id)
    return projectIds

}


export const analyticsService = {
    async getAnalyticsData(params: GetAnalyticsDataParams): Promise<AnalyticsResponse> {
        const { startDate, endDate, projectIds } = params
        // Removed unused variable projectIds
        const query = flowRunRepo()
            .createQueryBuilder('flowRun')
            .where('flowRun.projectId IN (:...projectIds)')
            .where('DATE(flowRun.finishTime) BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .select('flowRun.projectId')
            .addSelect('DATE(flowRun.finishTime)', 'date')
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
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
                projectIds,
            })
            .groupBy('DATE(flowRun.finishTime)')
            .orderBy('date', 'ASC')

        const rawResults = await query.getRawMany()

        const results: AnalyticsResponse = rawResults.map(result => ({
            date: new Date(result.date).toISOString(),
            successfulFlowRuns: Number(result.successfulFlowRuns),
            failedFlowRuns: Number(result.failedFlowRuns),
            successfulFlowRunsDuration: Number(result.successfulFlowRunsDuration),
            failedFlowRunsDuration: Number(result.failedFlowRunsDuration),
        }))

        return results
    },
}


export const overViewService = {
    async getOverview(projectIds: string[]): Promise<OverviewResponse> {
        const { start, end } = {
            start: dayjs().startOf('month').toISOString(),
            end: dayjs().endOf('month').toISOString(),
        }

        const result = await flowRepo()
            .createQueryBuilder('flow')
            .select('COUNT(flow.id)', 'workflowCount')
            .addSelect(
                'SUM(CASE WHEN flow.status = :enabledStatus THEN 1 ELSE 0 END)',
                'activeWorkflowCount',
            )
            .addSelect(
                `(SELECT COUNT(*) FROM flow_run flowRun 
                  WHERE flowRun.projectId IN (:...projectIds) 
                  AND DATE(flowRun.finishTime) BETWEEN :start AND :end)`,
                'flowRunCount',
            )
            .where('flow.projectId IN (:...projectIds)', { projectIds })
            .setParameters({ enabledStatus: FlowStatus.ENABLED, start, end })
            .getRawOne()

        return {
            workflowCount: Number(result.workflowCount || 0),
            activeWorkflowCount: Number(result.activeWorkflowCount || 0),
            flowRunCount: Number(result.flowRunCount || 0),
        }
    },
}

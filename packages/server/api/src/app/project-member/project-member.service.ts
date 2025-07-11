import { apId, Cursor, ProjectMember, ProjectMemberRole, SeekPage } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { projectService } from '../project/project-service'
import { ProjectMemberEntity } from './project-member.entity'

const repo = repoFactory(ProjectMemberEntity)

export const projectMemberService = {
    async upsert({ userId, projectId, projectRole }: UpsertParams): Promise<ProjectMember> {
        const { platformId } = await projectService.getOneOrThrow(projectId)

        const existingMember = await repo().findOneBy({
            userId,
            projectId,
            platformId,
        })

        const memberId = existingMember?.id ?? apId()

        const member: Omit<ProjectMember, 'created' | 'updated'> = {
            id: memberId,
            userId,
            platformId,
            projectId,
            projectRole,
        }

        await repo().upsert(member, [
            'projectId',
            'userId',
            'platformId',
        ])

        return repo().findOneOrFail({
            where: {
                id: memberId,
            },
        })
    },

    async delete({ projectId, projectMemberId }: DeleteParams): Promise<void> {
        await repo().delete({ projectId, id: projectMemberId })
    },

    async list(
        {
            platformId,
            projectId,
            cursorRequest,
            limit,
        }: ListParams,
    ): Promise<SeekPage<ProjectMember>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: ProjectMemberEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = repo()
            .createQueryBuilder('project_member')
            .where({ platformId })

        if (projectId) {
            queryBuilder.andWhere({ projectId })
        }

        const { data, cursor } = await paginator.paginate(queryBuilder)

        return paginationHelper.createPage<ProjectMember>(data, cursor)
    },

    async getAuthorizedProjectIds(params: { platformId: string, userId: string }): Promise<string[]> {
        const projectMembers = await repo().findBy({
            userId: params.userId,
            platformId: params.platformId,
        })
        return projectMembers.map((member) => member.projectId)
    },
}

type UpsertParams = {
    userId: string
    projectId: string
    projectRole: ProjectMemberRole
}

type DeleteParams = {
    projectMemberId: string
    projectId: string
}

type ListParams = {
    platformId: string
    projectId?: string
    cursorRequest: Cursor | null
    limit: number
}

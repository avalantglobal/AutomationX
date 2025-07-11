import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'

export const ListProjectMemberQueryParams = Type.Object({
    projectId: Type.String(),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
})

export type ListProjectMemberQueryParams = Static<typeof ListProjectMemberQueryParams>

export enum ProjectMemberRole {
    EDITOR = 'EDITOR',
    VIEWER = 'VIEWER',
}

export const ListProjectMemberRoleBody = Type.Object({
    name: Type.String(),
    value: Type.Enum(ProjectMemberRole),
})

export type ListProjectMemberRoleBody = Static<typeof ListProjectMemberRoleBody>

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    userId: ApId,
    platformId: ApId,
    projectId: ApId,
    projectRole: Type.Enum(ProjectMemberRole),
})

export type ProjectMember = Static<typeof ProjectMember>

import { Static, Type } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'

export const FlowState = Type.Omit(PopulatedFlow, ['externalId'])
export type FlowState = Static<typeof FlowState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
})

export type ProjectState = Static<typeof ProjectState>

export const ConnectionState = Type.Object({
    externalId: Type.String(),
    pieceName: Type.String(),
})

export type ConnectionState = Static<typeof ConnectionState>
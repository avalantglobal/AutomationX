import { Static, Type } from '@sinclair/typebox'
import { EmailType, PasswordType } from '../../user/user'

export const SignInRequest = Type.Object({
    email: EmailType,
    password: PasswordType,
    action: Type.Optional(Type.String()),
    templateId: Type.Optional(Type.String()),
})

export type SignInRequest = Static<typeof SignInRequest>

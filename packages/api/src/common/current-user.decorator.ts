import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
}

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest() as { user?: AuthenticatedUser } // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
  if (!request.user) return undefined
  if (data) {
    return (request.user as unknown as Record<string, string | null>)[data as string]
  }
  return request.user
})

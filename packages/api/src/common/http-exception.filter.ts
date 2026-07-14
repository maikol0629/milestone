import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = 'INTERNAL_ERROR'
    let message = 'Error interno del servidor'
    let details: unknown = undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()

      if (typeof res === 'object') {
        const r = res as Record<string, unknown>
        code = (r.code as string | undefined) ?? this.statusToCode(status)
        message = (r.message as string | undefined) ?? exception.message
        details = r.details
      } else {
        message = typeof res === 'string' ? res : exception.message
      }
    } else if (exception instanceof Error) {
      message = exception.message
    }

    const errorBody: Record<string, unknown> = { code, message }
    if (details !== undefined) {
      errorBody.details = details
    }

    response.status(status).json({
      success: false,
      error: errorBody,
    })
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT',
    }
    return map[status] ?? 'INTERNAL_ERROR'
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, map } from 'rxjs'

export interface PaginatedData {
  items: unknown[]
  meta: { page: number; limit: number; total: number }
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (data === null || data === undefined) {
          return { success: true, data: null }
        }
        if (this.isPaginated(data)) {
          return { success: true, data: data.items, meta: data.meta }
        }
        return { success: true, data }
      }),
    )
  }

  private isPaginated(data: unknown): data is PaginatedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      'meta' in data &&
      Array.isArray((data as PaginatedData).items)
    )
  }
}

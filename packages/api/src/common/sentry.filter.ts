import { Catch, type ArgumentsHost } from '@nestjs/common'
import * as Sentry from '@sentry/node'

import { AllExceptionsFilter } from './http-exception.filter.js'

@Catch()
export class SentryFilter extends AllExceptionsFilter {
  override catch(exception: unknown, host: ArgumentsHost) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(exception)
    }
    super.catch(exception, host)
  }
}

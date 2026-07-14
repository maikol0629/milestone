import { Module } from '@nestjs/common'

import { TimeSessionsController } from './time-sessions.controller.js'
import { TimeSessionsService } from './time-sessions.service.js'

@Module({
  controllers: [TimeSessionsController],
  providers: [TimeSessionsService],
})
export class TimeSessionsModule {}

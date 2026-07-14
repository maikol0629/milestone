import { Module } from '@nestjs/common'

import { EventExpansionService } from './event-expansion.service.js'
import { EventsController } from './events.controller.js'
import { EventsService } from './events.service.js'

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventExpansionService],
  exports: [EventExpansionService],
})
export class EventsModule {}

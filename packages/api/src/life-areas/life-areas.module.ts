import { Module } from '@nestjs/common'

import { LifeAreasController } from './life-areas.controller.js'
import { LifeAreasService } from './life-areas.service.js'

@Module({
  controllers: [LifeAreasController],
  providers: [LifeAreasService],
})
export class LifeAreasModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { ActivitiesModule } from './activities/activities.module.js'
import { AuthModule } from './auth/auth.module.js'
import { AllExceptionsFilter } from './common/http-exception.filter.js'
import { ResponseInterceptor } from './common/response.interceptor.js'
import { appConfig, authConfig, validateEnv } from './config/index.js'
import { EventsModule } from './events/events.module.js'
import { GoalsModule } from './goals/goals.module.js'
import { HealthController } from './health.controller.js'
import { LifeAreasModule } from './life-areas/life-areas.module.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { ProjectsModule } from './projects/projects.module.js'
import { SearchModule } from './search/search.module.js'
import { SyncModule } from './sync/sync.module.js'
import { TimeSessionsModule } from './time-sessions/time-sessions.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [authConfig, appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    LifeAreasModule,
    GoalsModule,
    ProjectsModule,
    SearchModule,
    ActivitiesModule,
    EventsModule,
    TimeSessionsModule,
    SyncModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}

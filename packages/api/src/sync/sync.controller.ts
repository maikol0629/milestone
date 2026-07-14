import type { SyncChange } from '@milestone/shared'
import { syncPullSchema, syncPushSchema } from '@milestone/shared'
import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { CurrentUser, type AuthenticatedUser } from '../common/current-user.decorator.js'
import { SyncPushDto, SyncPullDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { SyncService } from './sync.service.js'

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Push changes to server' })
  @ApiBody({ type: SyncPushDto })
  @ApiResponse({ status: 201, description: 'Changes pushed successfully' })
  async push(
    @Body(createZodPipe(syncPushSchema)) body: { changes: SyncChange[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.syncService.push(user.id, body.changes)
  }

  @Post('pull')
  @ApiOperation({ summary: 'Pull changes from server' })
  @ApiBody({ type: SyncPullDto })
  @ApiResponse({ status: 201, description: 'Changes pulled successfully' })
  async pull(
    @Body(createZodPipe(syncPullSchema)) body: { last_sync_timestamp: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.syncService.pull(user.id, body.last_sync_timestamp)
  }
}

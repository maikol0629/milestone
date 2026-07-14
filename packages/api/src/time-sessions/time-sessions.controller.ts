import { createTimeSessionSchema, updateTimeSessionSchema } from '@milestone/shared'
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { CurrentUser, type AuthenticatedUser } from '../common/current-user.decorator.js'
import { CreateTimeSessionDto, UpdateTimeSessionDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { TimeSessionsService } from './time-sessions.service.js'

@ApiTags('Time Sessions')
@ApiBearerAuth()
@Controller('time-sessions')
@UseGuards(JwtAuthGuard)
export class TimeSessionsController {
  constructor(private readonly service: TimeSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all time sessions' })
  @ApiQuery({ name: 'activity_id', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Time sessions retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('activity_id') activityId?: string) {
    return this.service.findAll(user.id, activityId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a time session by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Time session retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a time session' })
  @ApiBody({ type: CreateTimeSessionDto })
  @ApiResponse({ status: 201, description: 'Time session created successfully' })
  create(
    @Body(createZodPipe(createTimeSessionSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body as Parameters<typeof this.service.create>[1])
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a time session' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateTimeSessionDto })
  @ApiResponse({ status: 200, description: 'Time session updated successfully' })
  update(
    @Param('id') id: string,
    @Body(createZodPipe(updateTimeSessionSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body as Parameters<typeof this.service.update>[2])
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a time session' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Time session deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id)
  }
}

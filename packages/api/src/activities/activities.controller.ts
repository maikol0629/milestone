import { createActivitySchema, updateActivitySchema } from '@milestone/shared'
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
import { CreateActivityDto, UpdateActivityDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { ActivitiesService } from './activities.service.js'

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all activities' })
  @ApiQuery({ name: 'project_id', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('project_id') projectId?: string) {
    return this.service.findAll(user.id, projectId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an activity by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create an activity' })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  create(
    @Body(createZodPipe(createActivitySchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body as Parameters<typeof this.service.create>[1])
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  update(
    @Param('id') id: string,
    @Body(createZodPipe(updateActivitySchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body as Parameters<typeof this.service.update>[2])
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id)
  }
}

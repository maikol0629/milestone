import { createGoalSchema, updateGoalSchema } from '@milestone/shared'
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
import { CreateGoalDto, UpdateGoalDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { GoalsService } from './goals.service.js'

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all goals' })
  @ApiQuery({ name: 'life_area_id', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('life_area_id') lifeAreaId?: string) {
    return this.service.findAll(user.id, lifeAreaId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Goal retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a goal' })
  @ApiBody({ type: CreateGoalDto })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  create(
    @Body(createZodPipe(createGoalSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body as Parameters<typeof this.service.create>[1])
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateGoalDto })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  update(
    @Param('id') id: string,
    @Body(createZodPipe(updateGoalSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body as Parameters<typeof this.service.update>[2])
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Goal deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id)
  }
}

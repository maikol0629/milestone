import { createProjectSchema, updateProjectSchema } from '@milestone/shared'
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
import { CreateProjectDto, UpdateProjectDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { ProjectsService } from './projects.service.js'

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiQuery({ name: 'goal_id', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('goal_id') goalId?: string) {
    return this.service.findAll(user.id, goalId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  create(
    @Body(createZodPipe(createProjectSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body as Parameters<typeof this.service.create>[1])
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  update(
    @Param('id') id: string,
    @Body(createZodPipe(updateProjectSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body as Parameters<typeof this.service.update>[2])
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id)
  }
}

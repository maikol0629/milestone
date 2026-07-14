import { createLifeAreaSchema, updateLifeAreaSchema } from '@milestone/shared'
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { CurrentUser, type AuthenticatedUser } from '../common/current-user.decorator.js'
import { CreateLifeAreaDto, UpdateLifeAreaDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { LifeAreasService } from './life-areas.service.js'

@ApiTags('Life Areas')
@ApiBearerAuth()
@Controller('life-areas')
@UseGuards(JwtAuthGuard)
export class LifeAreasController {
  constructor(private readonly service: LifeAreasService) {}

  @Get()
  @ApiOperation({ summary: 'List all life areas' })
  @ApiResponse({ status: 200, description: 'Life areas retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a life area by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Life area retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a life area' })
  @ApiBody({ type: CreateLifeAreaDto })
  @ApiResponse({ status: 201, description: 'Life area created successfully' })
  create(
    @Body(createZodPipe(createLifeAreaSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body as Parameters<typeof this.service.create>[1])
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a life area' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateLifeAreaDto })
  @ApiResponse({ status: 200, description: 'Life area updated successfully' })
  update(
    @Param('id') id: string,
    @Body(createZodPipe(updateLifeAreaSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body as Parameters<typeof this.service.update>[2])
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a life area' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Life area deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id)
  }
}

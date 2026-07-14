import { createEventSchema, eventQuerySchema, updateEventSchema } from '@milestone/shared'
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
import { CreateEventDto, UpdateEventDto } from '../common/dto.js'
import { createZodPipe } from '../common/zod-validation.pipe.js'

import { EventExpansionService } from './event-expansion.service.js'
import { EventsService } from './events.service.js'

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly expansionService: EventExpansionService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all events',
    description: `
    Retrieve events with optional filtering by date range, type, or activity.
    Supports pagination.
    `,
  })
  @ApiQuery({
    name: 'start',
    type: 'string',
    required: false,
    description: 'ISO date to filter events from',
  })
  @ApiQuery({
    name: 'end',
    type: 'string',
    required: false,
    description: 'ISO date to filter events until',
  })
  @ApiQuery({
    name: 'type',
    type: 'string',
    required: false,
    description: 'Event type: event, reminder, work_block',
  })
  @ApiQuery({ name: 'page', type: 'number', required: false, default: 1 })
  @ApiQuery({ name: 'limit', type: 'number', required: false, default: 50, maximum: 100 })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(createZodPipe(eventQuerySchema)) query: unknown,
  ) {
    const q = query as { start?: string; end?: string; type?: string; page: number; limit: number }
    return this.service.findAll({
      userId: user.id,
      start: q.start,
      end: q.end,
      type: q.type,
      page: q.page,
      limit: q.limit,
    })
  }

  @Get('expanded')
  @ApiOperation({
    summary: 'Get events expanded by recurrence',
    description: `
    Returns all event occurrences within a date range, expanding recurring events.
    Useful for calendar views.
    `,
  })
  @ApiQuery({ name: 'start', type: 'string', required: true, description: 'ISO date range start' })
  @ApiQuery({ name: 'end', type: 'string', required: true, description: 'ISO date range end' })
  @ApiQuery({ name: 'type', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Expanded events retrieved successfully' })
  async getExpandedEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('type') type?: string,
  ) {
    if (!start || !end) {
      throw new Error('start and end query parameters are required')
    }

    const allEvents = await this.service.findAll({
      userId: user.id,
      start,
      end,
      type,
      limit: 1000, // Get all events in range
    })

    const expanded = this.expansionService.expandEventsByDateRange(
      allEvents.items,
      new Date(start),
      new Date(end),
    )

    return { items: expanded, meta: { total: expanded.length } }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Get(':id/occurrences')
  @ApiOperation({
    summary: 'Get next occurrences of a recurring event',
    description: 'Returns the next N occurrences of a recurring event',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Event ID' })
  @ApiQuery({ name: 'count', type: 'number', required: false, default: 5 })
  @ApiResponse({ status: 200, description: 'Occurrences retrieved successfully' })
  async getOccurrences(
    @Param('id') id: string,
    @Query('count') count = '5',
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const event = await this.service.findOne(id, user.id)
    const parsed = Number.parseInt(count, 10)
    return this.expansionService.getNextOccurrences(
      event,
      Number.isFinite(parsed) && parsed > 0 ? parsed : 5,
    )
  }

  @Post()
  @ApiOperation({
    summary: 'Create an event',
    description: `
    Create a new event with optional recurrence.
    
    **Recurrence fields:**
    - \`recurrence_rule\`: 'daily' | 'weekly'
    - \`recurrence_interval\`: repeat every N days/weeks
    - \`recurrence_days_of_week\`: comma-separated days (0=Sun, 6=Sat), only for weekly
    - \`recurrence_end_date\`: optional end date for recurrence
    
    **Milestone fields:**
    - \`is_milestone\`: mark as milestone (one-time event)
    - \`milestone_date\`: when the milestone occurs
    `,
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(
    @Body(createZodPipe(createEventSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(user.id, body as Parameters<typeof this.service.create>[1])
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  update(
    @Param('id') id: string,
    @Body(createZodPipe(updateEventSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.id, body as Parameters<typeof this.service.update>[2])
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id)
  }
}

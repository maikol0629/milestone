import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateLifeAreaDto {
  @ApiProperty({ description: 'Name of the life area' })
  name!: string

  @ApiPropertyOptional({ description: 'Color of the life area' })
  color?: string
}

export class UpdateLifeAreaDto {
  @ApiPropertyOptional({ description: 'Name of the life area' })
  name?: string

  @ApiPropertyOptional({ description: 'Color of the life area' })
  color?: string
}

export class CreateGoalDto {
  @ApiProperty({ description: 'Title of the goal' })
  title!: string

  @ApiPropertyOptional({ description: 'Description of the goal' })
  description?: string

  @ApiProperty({ description: 'Life area ID' })
  life_area_id!: string
}

export class UpdateGoalDto {
  @ApiPropertyOptional({ description: 'Title of the goal' })
  title?: string

  @ApiPropertyOptional({ description: 'Description of the goal' })
  description?: string

  @ApiPropertyOptional({ description: 'Life area ID' })
  life_area_id?: string
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project' })
  name!: string

  @ApiProperty({ description: 'Goal ID' })
  goal_id!: string
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Name of the project' })
  name?: string

  @ApiPropertyOptional({ description: 'Goal ID' })
  goal_id?: string
}

export class CreateActivityDto {
  @ApiProperty({ description: 'Title of the activity' })
  title!: string

  @ApiProperty({ description: 'Project ID' })
  project_id!: string
}

export class UpdateActivityDto {
  @ApiPropertyOptional({ description: 'Title of the activity' })
  title?: string

  @ApiPropertyOptional({ description: 'Project ID' })
  project_id?: string
}

export class CreateEventDto {
  @ApiProperty({ description: 'Title of the event' })
  title!: string

  @ApiPropertyOptional({ description: 'Description of the event' })
  description?: string

  @ApiProperty({ description: 'Start date/time' })
  start_at!: string

  @ApiProperty({ description: 'End date/time' })
  end_at!: string

  @ApiProperty({ enum: ['meeting', 'task', 'reminder', 'focus'], description: 'Type of event' })
  type!: 'meeting' | 'task' | 'reminder' | 'focus'

  @ApiPropertyOptional({ description: 'Activity ID' })
  activity_id?: string
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Title of the event' })
  title?: string

  @ApiPropertyOptional({ description: 'Description of the event' })
  description?: string

  @ApiPropertyOptional({ description: 'Start date/time' })
  start_at?: string

  @ApiPropertyOptional({ description: 'End date/time' })
  end_at?: string

  @ApiPropertyOptional({
    enum: ['meeting', 'task', 'reminder', 'focus'],
    description: 'Type of event',
  })
  type?: 'meeting' | 'task' | 'reminder' | 'focus'

  @ApiPropertyOptional({ description: 'Activity ID' })
  activity_id?: string
}

export class EventQueryDto {
  @ApiPropertyOptional({ description: 'Start date filter' })
  start?: string

  @ApiPropertyOptional({ description: 'End date filter' })
  end?: string

  @ApiPropertyOptional({ description: 'Event type filter' })
  type?: string

  @ApiPropertyOptional({ description: 'Page number' })
  page?: number

  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number
}

export class CreateTimeSessionDto {
  @ApiProperty({ description: 'Start date/time' })
  start_at!: string

  @ApiPropertyOptional({ description: 'End date/time' })
  end_at?: string

  @ApiProperty({ description: 'Activity ID' })
  activity_id!: string
}

export class UpdateTimeSessionDto {
  @ApiPropertyOptional({ description: 'Start date/time' })
  start_at?: string

  @ApiPropertyOptional({ description: 'End date/time' })
  end_at?: string
}

export class SyncPushDto {
  @ApiProperty({ type: [Object], description: 'Array of changes' })
  changes!: Record<string, unknown>[]
}

export class SyncPullDto {
  @ApiProperty({ description: 'Last sync timestamp' })
  last_sync_timestamp!: string
}

export class RegisterDto {
  @ApiProperty({ description: 'Email address' })
  email!: string

  @ApiProperty({ description: 'Password' })
  password!: string

  @ApiProperty({ description: 'User name' })
  name!: string
}

export class LoginDto {
  @ApiProperty({ description: 'Email address' })
  email!: string

  @ApiProperty({ description: 'Password' })
  password!: string
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  refresh_token!: string
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User name' })
  name?: string

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string
}

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query' })
  q?: string

  @ApiPropertyOptional({ description: 'Type filter' })
  type?: string

  @ApiPropertyOptional({ description: 'Parent ID filter' })
  parent_id?: string

  @ApiPropertyOptional({ description: 'Start date filter' })
  start?: string

  @ApiPropertyOptional({ description: 'End date filter' })
  end?: string
}

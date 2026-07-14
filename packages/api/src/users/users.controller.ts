import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { CurrentUser, type AuthenticatedUser } from '../common/current-user.decorator.js'
import { UpdateProfileDto } from '../common/dto.js'

import { UsersService } from './users.service.js'

@Controller()
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    const dbUser = await this.usersService.findById(user.id)
    if (!dbUser) return null
    return { id: dbUser.id, email: dbUser.email, name: dbUser.name }
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name?: string; email?: string },
  ) {
    const updated = await this.usersService.update(user.id, body)
    return { id: updated.id, email: updated.email, name: updated.name }
  }
}

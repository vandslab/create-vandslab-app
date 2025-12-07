import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
@ApiTags('User Management')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiCreatedResponse({ type: UserEntity, isArray: false })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Email already exists' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ type: UserEntity, isArray: true })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a single user' })
  @ApiOkResponse({ type: UserEntity })
  @ApiParam({ name: 'userId', required: true })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('userId') userId: string) {
    return this.userService.findOne(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'userId', required: true })
  @ApiOkResponse({ type: UserEntity })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'userId', required: true })
  @ApiOkResponse({ description: 'Success' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async remove(@Param('userId') userId: string) {
    return this.userService.remove(userId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('Admin')
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll(
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('sales')
  @Roles('Admin', 'Manager')
  findSaleUsers() {
    return this.userService.findSaleUsers();
  }

  @Get(':id')
  @Roles('Admin')
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  deactivate(@Param('id') id: string) {
    return this.userService.deactivate(id);
  }

  @Patch(':id/roles')
  @Roles('Admin')
  assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.userService.assignRoles(id, dto);
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

export const publicUserSelect = {
  id: true,
  name: true,
  cpf: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create({ password, ...data }: CreateUserDto) {
    return this.prisma.user.create({
      data: { ...data, passwordHash: await bcrypt.hash(password, SALT_ROUNDS) },
      select: publicUserSelect,
    });
  }

  async findById(id: string, requester: AuthUser) {
    this.assertCanAccess(id, requester);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(
    id: string,
    { password, ...data }: UpdateUserDto,
    requester: AuthUser,
  ) {
    this.assertCanAccess(id, requester);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(password && {
          passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
        }),
      },
      select: publicUserSelect,
    });
  }

  async remove(id: string, requester: AuthUser) {
    this.assertCanAccess(id, requester);
    await this.prisma.user.delete({ where: { id } });
  }

  private assertCanAccess(id: string, requester: AuthUser) {
    if (requester.id !== id && requester.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }
  }
}

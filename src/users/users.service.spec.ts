import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const owner: AuthUser = { id: 'user-1', email: 'a@a.com', role: Role.USER };
  const stranger: AuthUser = {
    id: 'user-2',
    email: 'b@b.com',
    role: Role.USER,
  };
  const admin: AuthUser = { id: 'admin', email: 'c@c.com', role: Role.ADMIN };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('stores a bcrypt hash instead of the plain password', async () => {
      await service.create({
        name: 'Filipe',
        cpf: '52998224725',
        email: 'filipe@email.com',
        password: 'senhaSegura123',
      });

      const [{ data }] = prisma.user.create.mock.calls[0] as [
        { data: { passwordHash: string } },
      ];
      expect(data).not.toHaveProperty('password');
      expect(await bcrypt.compare('senhaSegura123', data.passwordHash)).toBe(
        true,
      );
    });
  });

  describe('access control', () => {
    it('lets users read their own profile', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: owner.id });
      await expect(service.findById(owner.id, owner)).resolves.toEqual({
        id: owner.id,
      });
    });

    it('lets admins read any profile', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: owner.id });
      await expect(service.findById(owner.id, admin)).resolves.toBeDefined();
    });

    it.each([
      ['read', (s: UsersService) => s.findById(owner.id, stranger)],
      ['update', (s: UsersService) => s.update(owner.id, {}, stranger)],
      ['delete', (s: UsersService) => s.remove(owner.id, stranger)],
    ])('forbids other users to %s', async (_, action) => {
      await expect(action(service)).rejects.toThrow(ForbiddenException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });

  it('throws NotFound when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findById(owner.id, owner)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('only rehashes the password when a new one is sent', async () => {
    await service.update(owner.id, { name: 'Novo nome' }, owner);
    const [{ data }] = prisma.user.update.mock.calls[0] as [{ data: object }];
    expect(data).toEqual({
      name: 'Novo nome',
    });
  });
});

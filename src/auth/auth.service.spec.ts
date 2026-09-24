import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('returns a token for valid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'user-1',
      email: 'filipe@email.com',
      role: Role.USER,
      passwordHash: await bcrypt.hash('senhaSegura123', 4),
    });

    await expect(
      service.login({ email: 'filipe@email.com', password: 'senhaSegura123' }),
    ).resolves.toEqual({ accessToken: 'signed-token', tokenType: 'Bearer' });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'filipe@email.com',
      role: Role.USER,
    });
  });

  it('rejects a wrong password', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      passwordHash: await bcrypt.hash('outraSenha', 4),
    });
    await expect(
      service.login({ email: 'filipe@email.com', password: 'senhaSegura123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an unknown email with the same error', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);
    await expect(
      service.login({ email: 'ninguem@email.com', password: 'x' }),
    ).rejects.toThrow('Invalid credentials');
  });
});

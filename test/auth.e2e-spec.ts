import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

interface UserBody {
  id: string;
  name: string;
  email: string;
}

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const alice = {
    name: 'Alice',
    cpf: '529.982.247-25',
    email: 'alice@email.com',
    password: 'senhaSegura123',
  };
  const bob = {
    name: 'Bob',
    cpf: '111.444.777-35',
    email: 'bob@email.com',
    password: 'senhaSegura456',
  };

  const login = async (email: string, password: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };

  const register = async (data: typeof alice) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(data)
      .expect(201);
    return res.body as UserBody;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('GET /health is public', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('registers, logs in and reads own profile', async () => {
    const created = await register(alice);
    expect(created).toMatchObject({
      name: 'Alice',
      cpf: '52998224725',
      email: 'alice@email.com',
      role: 'USER',
    });
    expect(created).not.toHaveProperty('passwordHash');

    const token = await login(alice.email, alice.password);
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((res.body as UserBody).email).toBe(alice.email);
  });

  it('rejects invalid CPF and unknown fields', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...alice, cpf: '111.111.111-11', isAdmin: true })
      .expect(400);
  });

  it('returns 409 for duplicated email', async () => {
    await register(alice);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...bob, email: alice.email })
      .expect(409);
  });

  it('lets users update themselves keeping the same email', async () => {
    const user = await register(alice);
    const token = await login(alice.email, alice.password);

    await request(app.getHttpServer())
      .patch(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice Silva', email: alice.email })
      .expect(200)
      .expect(({ body }: { body: UserBody }) =>
        expect(body.name).toBe('Alice Silva'),
      );
  });

  it('forbids users from touching other accounts', async () => {
    const aliceUser = await register(alice);
    await register(bob);
    const bobToken = await login(bob.email, bob.password);

    await request(app.getHttpServer())
      .delete(`/users/${aliceUser.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(403);
  });

  it('requires a token on protected routes', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});

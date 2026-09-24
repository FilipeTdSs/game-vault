# 🎮 Game Vault API

![CI](https://github.com/FilipeTdSs/game-vault/actions/workflows/ci.yml/badge.svg)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)

API REST para gerenciar uma biblioteca pessoal de jogos: cadastro de usuários, autenticação JWT e, nas próximas etapas, catálogo de jogos, biblioteca/wishlist e importação assíncrona de dados via fila.

> 🚧 Em desenvolvimento. Veja o [roadmap](#-roadmap).

## ✨ Funcionalidades

- Cadastro e login com **JWT** (senha com hash **bcrypt**)
- **Guard global**: toda rota exige token, exceto as marcadas com `@Public()`
- **Autorização por dono do recurso**: o usuário só lê, edita e remove a própria conta (admins acessam qualquer uma)
- Controle de papéis (`USER` / `ADMIN`) com `@Roles()`
- Validação de **CPF** com dígitos verificadores, via decorator customizado do `class-validator`
- Tratamento centralizado dos erros do Prisma (`409` para duplicidade, `404` para registro inexistente)
- Validação das variáveis de ambiente na inicialização (Joi)
- Documentação interativa com **Swagger** em `/docs`

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | NestJS 11 + TypeScript |
| Banco | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Auth | `@nestjs/jwt` + bcrypt |
| Validação | class-validator / class-transformer, Joi |
| Testes | Jest (unitários) + Supertest (e2e com banco real) |
| CI | GitHub Actions (lint, build, testes unitários e e2e) |

## 📁 Estrutura

```
src/
├── auth/            # login, registro, guards (JWT e roles) e decorators
├── users/           # CRUD de usuários com checagem de dono do recurso
├── prisma/          # PrismaService (módulo global)
├── common/
│   ├── filters/     # tradução de erros do Prisma para HTTP
│   └── validators/  # @IsCpf()
├── config/          # validação das variáveis de ambiente
├── app.setup.ts     # pipes e filtros globais (compartilhado com os testes e2e)
└── main.ts
prisma/
├── schema.prisma
└── migrations/
test/                # testes e2e (migrations aplicadas no global-setup)
```

## 🚀 Como rodar

**Pré-requisitos:** Node.js 22+ e PostgreSQL (local ou via Docker).

```bash
# 1. Instale as dependências (já gera o Prisma Client)
npm install

# 2. Configure o ambiente
cp .env.example .env
# edite DATABASE_URL e JWT_SECRET

# 3. (Opcional) Suba o PostgreSQL com Docker
docker compose up -d

# 4. Rode as migrations
npm run db:migrate

# 5. Inicie em modo desenvolvimento
npm run start:dev
```

A API sobe em `http://localhost:3000` e a documentação fica em `http://localhost:3000/docs`.

## 🧪 Testes

```bash
npm test            # unitários
npm run test:e2e    # e2e com banco real (aplica as migrations antes de rodar)
npm run test:cov    # cobertura
```

Os testes e2e leem o arquivo `.env.test`, que tem as mesmas variáveis do `.env` apontando para **outro banco** (ex.: `game_vault_test`), já que eles apagam os dados a cada teste:

```bash
cp .env.example .env.test
# troque o banco do DATABASE_URL para game_vault_test
```

## 📚 Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/register` | — | Cria uma conta |
| `POST` | `/auth/login` | — | Retorna o `accessToken` |
| `GET` | `/auth/me` | Bearer | Dados do usuário logado |
| `GET` | `/users/:id` | Bearer (dono ou admin) | Busca usuário |
| `PATCH` | `/users/:id` | Bearer (dono ou admin) | Atualiza usuário |
| `DELETE` | `/users/:id` | Bearer (dono ou admin) | Remove usuário |

## 🗺️ Roadmap

- [x] Setup: NestJS, Prisma, PostgreSQL, Docker Compose, CI
- [x] Autenticação JWT e usuários com autorização por dono do recurso
- [ ] Refresh token
- [ ] Catálogo de jogos (CRUD de admin) com paginação, filtros e ordenação
- [ ] Biblioteca do usuário (jogando, zerado, wishlist) e avaliações
- [ ] Importação de jogos da API RAWG com fila (**BullMQ + Redis**)
- [ ] Cache das listagens com Redis e rate limiting
- [ ] Deploy
- [ ] Front-end em Angular

## 👤 Autor

**Filipe Teles** · [LinkedIn](https://www.linkedin.com/in/filipe-teles-476262215/) · [GitHub](https://github.com/FilipeTdSs)

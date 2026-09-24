import type { AuthUser } from '../auth/auth-user.interface';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

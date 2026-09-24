import { execSync } from 'node:child_process';
import './load-test-env';

// Makes sure the test database exists and is migrated before the e2e suite.
export default function globalSetup() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}

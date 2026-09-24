import { config } from 'dotenv';

// Loads .env.test for e2e runs. Variables already set (e.g. in CI) win.
config({ path: '.env.test', quiet: true });

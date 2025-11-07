/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const run = (command: string) => {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: 'inherit' });
};

const requiredEnv = [
  'HOLD_MINUTES',
  'CURRENCY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
];

// Ensure all required values exist before triggering any CLI commands.
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} in functions/.env. Please set it before running init.`);
  }
});

try {
  // Push env vars into Firebase runtime config.
  run('npm run setup');

  // Seed Firestore with pilot data for testing.
  run('npm run seed');

  // Build and deploy Cloud Functions plus Firestore indexes.
  run('npm run deploy:full');

  console.log(
    'Project initialization complete. Remember: business onboarding and user approvals are still manual steps in Firestore.',
  );
} catch (error) {
  console.error('Project initialization failed:', error);
  process.exit(1);
}

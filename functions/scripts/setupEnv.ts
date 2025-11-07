/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

const envPath = resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const required = {
  HOLD_MINUTES: process.env.HOLD_MINUTES,
  CURRENCY: process.env.CURRENCY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
};

// Guard required env values early so CLI failures are explicit.
Object.entries(required).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing ${key} in functions/.env`);
  }
});

// Build the firebase CLI command with all config pairs.
const command = [
  'firebase functions:config:set',
  `booking.hold_minutes="${required.HOLD_MINUTES}"`,
  `booking.currency="${required.CURRENCY}"`,
  `stripe.secret_key="${required.STRIPE_SECRET_KEY}"`,
  `stripe.publishable_key="${required.STRIPE_PUBLISHABLE_KEY}"`,
].join(' ');

console.log('Configuring functions runtime with:', required);
execSync(command, { stdio: 'inherit' });
console.log('Firebase config updated.');

process.exit(0);

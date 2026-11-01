#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find @nitrostack/cli entry point
const localCli = path.resolve(__dirname, '../node_modules/@nitrostack/cli/dist/index.js');

if (!fs.existsSync(localCli)) {
  console.error('❌ @nitrostack/cli is not installed. Please run `npm install` first.');
  process.exit(1);
}

const args = [localCli, ...process.argv.slice(2)];
const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

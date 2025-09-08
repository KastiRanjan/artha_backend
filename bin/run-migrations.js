#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const runMigrations = () => {
  console.log('Running migrations...');
  
  const migrationProcess = spawn('npx', ['typeorm', 'migration:run'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  migrationProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Migrations completed successfully');
    } else {
      console.error(`Migration process exited with code ${code}`);
    }
  });
};

runMigrations();

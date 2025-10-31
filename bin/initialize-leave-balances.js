#!/usr/bin/env node

/**
 * Script to initialize leave balances for all users
 * 
 * Usage: node bin/initialize-leave-balances.js --year 2025
 */

const path = require('path');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const args = process.argv.slice(2);
  const yearIndex = args.indexOf('--year');
  const year = yearIndex !== -1 ? parseInt(args[yearIndex + 1]) : new Date().getFullYear();

  console.log(`Initializing leave balances for year: ${year}`);

  const userLeaveBalanceService = app.get('UserLeaveBalanceService');
  const leaveTypeRepository = app.get('LeaveTypeRepository');
  const userRepository = app.get('UserRepository');

  // Get all active leave types
  const leaveTypes = await leaveTypeRepository.find({
    where: { isActive: true }
  });

  if (leaveTypes.length === 0) {
    console.error('No active leave types found. Please create leave types first.');
    await app.close();
    return;
  }

  // Get all active users
  const users = await userRepository.find({
    where: { status: 'active' }
  });

  if (users.length === 0) {
    console.error('No active users found.');
    await app.close();
    return;
  }

  console.log(`Found ${users.length} active users and ${leaveTypes.length} leave types`);

  let successCount = 0;
  let failureCount = 0;

  for (const user of users) {
    console.log(`\nProcessing user: ${user.name} (${user.email})`);
    
    for (const leaveType of leaveTypes) {
      try {
        // Only allocate if leave type has a limit defined
        if (leaveType.maxDaysPerYear && leaveType.maxDaysPerYear > 0) {
          await userLeaveBalanceService.allocateLeave({
            userId: user.id,
            leaveTypeId: leaveType.id,
            year: year,
            allocatedDays: leaveType.maxDaysPerYear,
            carriedOverDays: 0
          });
          
          console.log(`  ✓ Allocated ${leaveType.maxDaysPerYear} days of ${leaveType.name}`);
          successCount++;
        } else {
          console.log(`  - Skipped ${leaveType.name} (unlimited or no limit set)`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to allocate ${leaveType.name}: ${error.message}`);
        failureCount++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Initialization complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Failures: ${failureCount}`);
  console.log(`========================================\n`);

  await app.close();
}

bootstrap().catch(err => {
  console.error('Error during initialization:', err);
  process.exit(1);
});

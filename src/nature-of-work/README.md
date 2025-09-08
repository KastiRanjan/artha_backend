# Nature of Work Entity Updates

## Overview
This update changes the nature of work handling in the project entity from using hardcoded string values to using a proper entity relationship. This enables better management of nature of work types with CRUD operations.

## Changes Made

### Backend
1. Updated `Project` entity to use a `ManyToOne` relationship with `NatureOfWork` entity.
2. Updated `ProjectsService` to handle the relationship with `NatureOfWork`.
3. Updated DTOs to use `NatureOfWork` entity ID instead of hardcoded strings.
4. Created migrations to:
   - Convert existing string values to entity relationships
   - Seed default nature of work types

### Frontend
The frontend was already prepared for this change, with:
- A Nature of Work service for API calls
- Integration in the ProjectForm component

## Migration Process
The migration process includes:
1. Creating a temporary column to store old values
2. Converting the column to a proper foreign key relationship
3. Mapping old string values to the appropriate `NatureOfWork` entities
4. Cleaning up the temporary column

## Running the Migration
To run the migration:
```bash
cd artha_backend
node bin/run-migrations.js
```

## Benefits
- Better data management with proper entity relationships
- CRUD operations for nature of work types
- Improved type safety and validation
- Extensibility for additional attributes (e.g., descriptions, categories)

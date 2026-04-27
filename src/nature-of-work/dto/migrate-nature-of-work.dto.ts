import { IsString, IsUUID, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';

export enum MigrationStrategy {
  TRANSFER = 'transfer',        // Transfer all projects to new nature of work
  FALLBACK = 'fallback',        // Keep old as inactive fallback, create new active one
  DUPLICATE = 'duplicate',      // Duplicate: keep old renamed as fallback, create new, migrate selected
}

export class MigrateNatureOfWorkDto {
  @IsUUID()
  sourceNatureOfWorkId: string;

  @IsEnum(MigrationStrategy)
  strategy: MigrationStrategy;

  @IsOptional()
  @IsUUID()
  targetNatureOfWorkId?: string; // For TRANSFER strategy - existing target

  @IsOptional()
  @IsString()
  newName?: string;              // For FALLBACK/DUPLICATE - new name for the updated/new entry

  @IsOptional()
  @IsString()
  newShortName?: string;         // For FALLBACK/DUPLICATE - new short name

  @IsOptional()
  @IsUUID()
  newGroupId?: string;           // For FALLBACK/DUPLICATE - group for the new entry

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  projectIdsToMigrate?: string[]; // For DUPLICATE - which projects to move to new
}

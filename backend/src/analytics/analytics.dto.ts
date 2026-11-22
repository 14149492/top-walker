import { CatalogEventType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

export class EventDto {
  @IsUUID() id!: string;
  @IsUUID() visitorId!: string;
  @IsEnum(CatalogEventType) type!: CatalogEventType;
  @IsString() @Length(1, 100) productId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(60) size?: number;
  @IsOptional() @IsString() @Length(1, 40) color?: string;
}
export class StatsQueryDto {
  @IsOptional() @Matches(/^(7|30|90)$/) days?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
}

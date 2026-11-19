import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class CatalogQueryDto {
  @IsOptional() @IsString() @MaxLength(100)
  q?: string;
  @IsOptional() @IsString() @MaxLength(80)
  category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60)
  size?: number;
}

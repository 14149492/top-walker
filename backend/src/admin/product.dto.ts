import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, Min, ValidateNested } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
export class VariantDto {
  @IsOptional() @IsString() @Length(1, 100) id?: string;
  @IsInt() @Min(1) @Max(60) size!: number;
  @Transform(trim) @IsString() @Length(1, 40) color!: string;
  @IsBoolean() available!: boolean;
  @IsOptional() @IsBoolean() availabilityConfirmed?: boolean;
}
export class PhotoDto {
  @IsOptional() @IsString() @Length(1, 100) id?: string;
  @IsOptional() @IsString() @Length(1, 100) assetId?: string;
  @Transform(trim) @IsString() @Length(1, 160) alt!: string;
  @IsOptional() @Transform(trim) @IsString() @Length(0, 40) color?: string | null;
}
export class ProductDto {
  @Transform(trim) @IsString() @Length(2, 120) name!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @Length(10, 3000) description!: string;
  @Transform(trim) @IsString() @Length(2, 120) material!: string;
  @IsOptional() @Transform(trim) @IsString() @Length(0, 200) sole?: string | null;
  @IsOptional() @Transform(trim) @IsString() @Length(0, 200) insole?: string | null;
  @IsOptional() @Transform(trim) @IsString() @Length(0, 200) lining?: string | null;
  @IsOptional() @Transform(trim) @IsString() @Length(0, 1000) details?: string | null;
  @IsString() @Length(1, 100) categoryId!: string;
  @IsString() @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, { message: 'El precio debe ser un decimal positivo con hasta dos decimales.' }) price!: string;
  @IsBoolean() published!: boolean;
  @IsBoolean() demo!: boolean;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(120) @ValidateNested({ each: true }) @Type(() => VariantDto) variants!: VariantDto[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => PhotoDto) photos!: PhotoDto[];
  @IsOptional() @IsInt() @Min(0) version?: number;
}
export class PublicationDto {
  @IsBoolean() published!: boolean;
  @IsInt() @Min(0) version!: number;
}
export class DeleteProductDto {
  @IsInt() @Min(0) version!: number;
}
export class CategoryDto {
  @Transform(trim) @IsString() @Length(2, 60) name!: string;
}
export class AdminQueryDto {
  @IsOptional() @Transform(trim) @IsString() @Length(0, 100) q?: string;
}

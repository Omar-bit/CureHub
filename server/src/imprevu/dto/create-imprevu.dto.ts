import {
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateImprevuDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  notifyPatients?: boolean = true;

  @IsOptional()
  @IsBoolean()
  blockTimeSlots?: boolean = true;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

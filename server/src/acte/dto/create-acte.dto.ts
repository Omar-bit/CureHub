import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateActeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  displayedElsewhere?: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsNumber()
  regularPrice?: number;

  @IsNumber()
  duration: number;

  @IsNumber()
  placementDuration: number;

  @IsNumber()
  minReservationGap: number;

  @IsNumber()
  stopUntilNextAppt: number;

  @IsOptional()
  @IsString()
  eligibilityRule?: string;

  @IsOptional()
  @IsNumber()
  blockReservationAfter?: number;

  @IsArray()
  @IsString({ each: true })
  canals: string[]; // ['INTERNET', 'TELEPHONE']

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  reminderType?: string;

  @IsOptional()
  @IsString()
  reminderMessage?: string;

  @IsOptional()
  @IsBoolean()
  notifyConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  consultationTypeIds?: string[];
}

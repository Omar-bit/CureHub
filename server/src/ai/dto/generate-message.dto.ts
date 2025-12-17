import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class GenerateMessageDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  clinicName?: string;

  @IsString()
  @IsIn(['fr', 'en'])
  @IsOptional()
  language?: string = 'fr';

  @IsString()
  @IsIn(['email', 'sms'])
  @IsNotEmpty()
  type: 'email' | 'sms';
}

export class GenerateMessageResponseDto {
  message: string;
  success: boolean;
}

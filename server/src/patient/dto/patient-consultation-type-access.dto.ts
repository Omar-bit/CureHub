import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePatientConsultationTypeAccessDto {
  @ApiProperty({
    description: 'Consultation type ID',
    example: 'clxyz123',
  })
  @IsString()
  consultationTypeId: string;

  @ApiProperty({
    description: 'Whether the consultation type is enabled for this patient',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;
}

export class PatientConsultationTypeAccessResponseDto {
  consultationTypeId: string;
  consultationTypeName: string;
  isEnabled: boolean;
}

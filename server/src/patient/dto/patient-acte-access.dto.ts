import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePatientActeAccessDto {
  @ApiProperty({
    description: 'Acte ID',
    example: 'clxyz123',
  })
  @IsString()
  acteId: string;

  @ApiProperty({
    description: 'Whether the acte is enabled for this patient',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;
}

export class PatientActeAccessResponseDto {
  acteId: string;
  acteName: string;
  isEnabled: boolean;
}

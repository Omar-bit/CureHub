import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePatientPermissionsDto {
  @IsOptional()
  @IsBoolean()
  canAddRelatives?: boolean;

  @IsOptional()
  @IsBoolean()
  canBookForRelatives?: boolean;
}

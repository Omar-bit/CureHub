import {
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class UpdateAgendaPreferencesDto {
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'mainColor must be a valid hex color code',
  })
  mainColor: string;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(1)
  @Max(24)
  endHour: number;

  @IsNumber()
  @Min(0.5)
  @Max(3.0)
  verticalZoom: number;

  @IsEnum(['A', 'B', 'C'])
  schoolVacationZone: string;
}

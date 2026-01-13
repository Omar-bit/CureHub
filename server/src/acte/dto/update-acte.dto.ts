import { PartialType } from '@nestjs/mapped-types';
import { CreateActeDto } from './create-acte.dto';

export class UpdateActeDto extends PartialType(CreateActeDto) {}

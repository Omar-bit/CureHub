import { PartialType } from '@nestjs/mapped-types';
import { CreateImprevuDto } from './create-imprevu.dto';

export class UpdateImprevuDto extends PartialType(CreateImprevuDto) {}

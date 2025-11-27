import { PartialType } from '@nestjs/swagger';
import { CreatePTODto } from './create-pto.dto';

export class UpdatePTODto extends PartialType(CreatePTODto) {}

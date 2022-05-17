import { PartialType } from '@nestjs/mapped-types';
import { CreateSigningDto } from './create-signing.dto';

export class UpdateSigningDto extends PartialType(CreateSigningDto) {}

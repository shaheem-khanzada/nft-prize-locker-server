import { IsNotEmpty, IsString } from 'class-validator';

export class ParamsDto {
  @IsNotEmpty()
  @IsString()
  tokenId: string;
}
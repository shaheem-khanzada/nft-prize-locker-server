import { IsNotEmpty, IsNumber } from 'class-validator';

export class ParamsDto {
  @IsNotEmpty()
  @IsNumber()
  tokenId: number;
}
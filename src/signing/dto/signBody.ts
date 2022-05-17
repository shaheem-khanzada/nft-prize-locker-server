import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignBody {
  @IsOptional()
  tokenId: string | number;

  @IsNotEmpty()
  @IsString()
  videoId: string;

  @IsNotEmpty()
  @IsString()
  account: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

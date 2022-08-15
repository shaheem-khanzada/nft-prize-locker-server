import { IsNotEmpty, IsString } from 'class-validator';

export class VideoBody {
  @IsNotEmpty()
  @IsString()
  videoId: string;

  @IsNotEmpty()
  @IsString()
  viewCount: string;
}

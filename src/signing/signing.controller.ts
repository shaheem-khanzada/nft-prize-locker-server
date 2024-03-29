import { Controller, Get, Body, Param, Post } from '@nestjs/common';
import { SignBody } from './dto/signBody';
import { VideoBody } from './dto/videoBody';
import { SigningService } from './signing.service';

@Controller()
export class SigningController {
  constructor(private readonly signingService: SigningService) {}

  @Post('signing')
  sendSignMessage(@Body() body: SignBody) {
    return this.signingService.sendSignMessage(body);
  }

  @Get('video/:videoId')
  findOne(@Param('videoId') videoId: string) {
    return this.signingService.getVideoById(videoId);
  }

  @Post('video')
  saveVideoDetails(@Body() video: VideoBody) {
    return this.signingService.saveVideoDetails(video);
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SigningService } from './signing.service';
import { SystemBuyService } from './system.service';
import { SigningController } from './signing.controller';
import { HttpModule } from '@nestjs/axios';
import { Video, VideoSchema } from 'src/schemas/video.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]),
    HttpModule
  ],
  controllers: [SigningController],
  providers: [SigningService, SystemBuyService]
})
export class SigningModule {}

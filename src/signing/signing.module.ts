import { Module } from '@nestjs/common';
import { SigningService } from './signing.service';
import { SystemBuyService } from './system.service';
import { SigningController } from './signing.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [SigningController],
  providers: [SigningService, SystemBuyService]
})
export class SigningModule {}

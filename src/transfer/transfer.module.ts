import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { Transfer, TransferSchema } from 'src/schemas/transfer.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transfer.name, schema: TransferSchema }])],
  controllers: [TransferController],
  providers: [TransferService]
})
export class TransferModule {}

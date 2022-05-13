import { Param } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Transfer } from 'src/schemas/transfer.schema';
import { TransferService } from './transfer.service';
import { Events } from 'src/constant';

@Controller('transfer/logs')
export class TransferController {
  constructor(private readonly transferService: TransferService) {
    const contract = this.transferService.initilizeContract();
    contract.on(
      Events.Acquire,
      (videoId, seller, buyer, amount, { transactionHash }) => {
        const payload: Transfer = {
          from: seller,
          to: buyer,
          tokenId: videoId.toString(),
          amount: amount.toString(),
          transactionHash,
          timestamp: Date.now(),
        };
        console.log(payload);
        this.transferService.saveTransferLogs(payload);
      },
    );
  }

  @Post()
  create(@Body() transfer: Transfer) {
    return this.transferService.create(transfer);
  }

  @Get(':tokenId')
  @UsePipes(
    new ValidationPipe({
      skipUndefinedProperties: true,
      skipNullProperties: true,
    }),
  )
  findAll(@Param('tokenId') tokenId: string) {
    return this.transferService.findAll(tokenId);
  }
}

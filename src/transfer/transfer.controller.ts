import { Param } from '@nestjs/common';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Transfer } from 'src/schemas/transfer.schema';
import { TransferService } from './transfer.service';
import { ParamsDto } from './dto/params';

@Controller('transfer/logs')
export class TransferController {
  constructor(private readonly transferService: TransferService) {
    const contract = this.transferService.initilizeContract();
    contract.events
      .Acquire({ fromBlock: 'latest' })
      .on(
        'data',
        ({
          transactionHash,
          returnValues: { videoId, seller, buyer, amount },
        }) => {
          try {
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
          } catch {
            // do nothing.
          }
        },
      );

    contract.events
      .Transfer({ fromBlock: 'latest' })
      .on(
        'data',
        async ({ transactionHash, returnValues: { from, to, tokenId } }) => {
          try {
            const nftDetails = await contract.methods
              .detailsByTokenId(tokenId)
              .call();
            const payload: Transfer = {
              from,
              to,
              tokenId: nftDetails.details.videoId,
              amount: '0',
              transactionHash,
              timestamp: Date.now(),
            };
            this.transferService.saveTransferLogs(payload);
          } catch {
            // do nothing.
          }
        },
      );
  }

  @Post()
  create(@Body() transfer: Transfer) {
    return this.transferService.create(transfer);
  }

  @Get(':tokenId')
  findAll(@Param() params: ParamsDto) {
    return this.transferService.findAll(params);
  }
}

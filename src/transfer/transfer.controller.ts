import { Param } from '@nestjs/common';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Transfer } from 'src/schemas/transfer.schema';
import { TransferService } from './transfer.service';
import { ParamsDto } from './dto/params';

@Controller('transfer/logs')
export class TransferController {
  constructor(private readonly transferService: TransferService) {
    const contract = this.transferService.initilizeContract();
    contract.events.Acquire({ fromBlock: 'latest' }, this.transferService.onAcquire);
    contract.events.Transfer({ fromBlock: 'latest' }, this.transferService.onTrasfer);
    contract.events.SponsorshipMint({ fromBlock: 'latest' }, this.transferService.onSponsorshipMint);
    // contract.events.Mint({ fromBlock: 'latest' }, this.transferService.onMint);
    contract.events.ClaimSponsorship({ fromBlock: 'latest' }, this.transferService.onClaimOwnership);
    contract.events.SetTransferable({ fromBlock: 'latest' }, this.transferService.onTrasferStatusChange);
    contract.events.CommentStatusChanged({ fromBlock: 'latest' }, this.transferService.onCommentStatusChange);
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

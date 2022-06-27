import { Param } from '@nestjs/common';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Transfer } from 'src/schemas/transfer.schema';
import { TransferService } from './transfer.service';
import { ParamsDto } from './dto/params';

@Controller('transfer/logs')
export class TransferController {
  constructor(private readonly transferService: TransferService) {
    const { contract, provider } = this.transferService.initilizeContract();

    // @ts-ignore
    provider.on('close', (error: any) => {
      console.error(`WebSocket connection closed. Error code ${error.code}, reason "${error.reason}"`);
    });

    provider.on('connect', () => { console.log('[Provider Connect]') });

    // @ts-ignore
    provider.on('error', e => {
      console.error('[Provider Error]', e);
    })
    
    // @ts-ignore
    provider.on('end', e => {
      console.error('[Provider End]', e);
    })

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

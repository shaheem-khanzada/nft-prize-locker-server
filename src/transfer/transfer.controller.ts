import { Param } from '@nestjs/common';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Transfer } from 'src/schemas/transfer.schema';
import { TransferService } from './transfer.service';
import { ParamsDto } from './dto/params';

@Controller('transfer/logs')
export class TransferController {
  subscription: any = null;
  contract: any = null;
  provider: any = null;
  constructor(private readonly transferService: TransferService) {
      this.initlizeWebSocketListeners();
  }

  initlizeWebSocketListeners() {
    console.log("Subscribing Events");
    const { contract, provider } = this.transferService.initilizeContract();
    this.provider = provider;
    this.contract = contract;
    this.subscribeProviderEvents();
    this.subscribeContractEvents();
  }

  subscribeProviderEvents() {
    this.provider.on('connect', () => {
      console.log('[Provider Connected]', this.provider.connected);
    });
    this.provider.on('close', () => {
      console.log('connection close');
      this.initlizeWebSocketListeners();
    });
  };

  async subscribeContractEvents(minusBlockNumber = 5) {
    if (this.subscription !== null) return;
    const latestBlock = await this.transferService.getBlock('latest');
    console.log('Latest Block Number', latestBlock.number);
    this.subscription = this.contract.events.allEvents(
      { fromBlock: latestBlock.number - minusBlockNumber },
      (error: any, result: any) => {
        switch (result?.event) {
          case 'Acquire':
            this.transferService.onAcquire(result);
            break;
          case 'Transfer':
            this.transferService.onTrasfer(result);
            break;
          case 'SponsorshipMint':
            this.transferService.onSponsorshipMint(result);
            break;
          case 'ClaimSponsorship':
            this.transferService.onClaimOwnership(result);
            break;
          case 'SetTransferable':
            this.transferService.onTrasferStatusChange(result);
            break;
          case 'CommentStatusChanged':
            this.transferService.onCommentStatusChange(result);
            break;
          default:
            if (error !== null) {
              console.log('contract events error', error.message);
              this.unsubscribeContractEvents();
            }
        }
      },
    );
  }

  unsubscribeContractEvents() {
    if (this.subscription && this.subscription.unsubscribe) {
      this.subscription.unsubscribe((_: any, success: any) => {
        if (success) {
          console.log('unsubscribe successfull');
          this.provider.reconnectOptions.auto = false;
          this.provider.disconnect();
          this.subscription = null;
          delete this.contract;
          delete this.provider;
        };
      });
    };
  };

  @Cron(CronExpression.EVERY_5_HOURS)
  async handleEvents() {
    this.unsubscribeContractEvents();
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

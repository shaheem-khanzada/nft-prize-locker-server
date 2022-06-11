import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Transfer, TransferDocument } from 'src/schemas/transfer.schema';
import { ConfigService } from '@nestjs/config';
import { BLOCKCHAIN_NETWORK_URL, CONTRACT_ADDRESS } from 'src/constant';
import { socialNftAbi } from 'src/contracts/abi';
import { ParamsDto } from './dto/params';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import {
  isZeroAddress,
  normalizeAcquire,
  normalizeClaimOwnership,
  normalizeCommentStatusChange,
  normalizeMint,
  normalizeSponsor,
  normalizeTransfer,
  normalizeTransferStatus,
} from 'src/helper/normalizeEventsData';

const WINDOW_TIME = 1000;

@Injectable()
export class TransferService {
  timmer: NodeJS.Timeout | null | undefined;
  queues: any = {};

  constructor(
    @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter,
  ) {}

  async create(transfer: Transfer): Promise<Transfer> {
    const isAlreadyExist = await this.findOneByTransactionHash(
      transfer.transactionHash,
    );
    if (isAlreadyExist) {
      throw new HttpException(
        `Log with Transaction Hash ${transfer.transactionHash} already exist`,
        HttpStatus.FOUND,
      );
    }
    const newTransferLog = new this.transferModel(transfer);
    this.eventEmitter.emit('log.created', newTransferLog);
    return newTransferLog.save();
  }

  findAll(params: ParamsDto): Promise<Transfer[]> {
    return this.transferModel.find({ tokenId: params.tokenId }).exec();
  }

  findOneByTransactionHash(transactionHash: string): Promise<Transfer> {
    return this.transferModel.findOne({ transactionHash }).exec();
  }

  initilizeContract() {
    const wssProviderUrl = this.configService.get<string>(
      BLOCKCHAIN_NETWORK_URL,
    );
    const web3 = new Web3(new Web3.providers.WebsocketProvider(wssProviderUrl));
    return new web3.eth.Contract(
      socialNftAbi as AbiItem[],
      this.configService.get<string>(CONTRACT_ADDRESS),
    );
  }

  saveTransferLogs = async (payload: Transfer) => {
    if (!this.timmer) {
      this.timmer = setTimeout(async () => {
        const _queues: Transfer[] = Object.keys(this.queues).map(
          (key) => this.queues[key],
        );
        this.queues = {};
        this.timmer = null;

        for (let i = 0; i < _queues.length; i += 1) {
          try {
            await this.create(_queues[i]);
          } catch (e) {
            console.log('[error]  ', e?.response || e);
          }
        }
      }, WINDOW_TIME);
    }
    this.queues[payload.transactionHash] = payload;
  };

  onAcquire = (error: any, result: any) => {
    if (!error) {
      try {
        const payload = normalizeAcquire(result);
        console.log(payload);
        this.saveTransferLogs(payload);
      } catch {
        // do nothing.
      }
    }
  };

  onMint = (error: any, result: any) => {
    if (!error) {
      try {
        const payload = normalizeMint(result);
        console.log(payload);
        this.saveTransferLogs(payload);
      } catch {
        // do nothing.
      }
    }
  };

  onSponsorshipMint = (error: any, result: any) => {
    if (!error) {
      try {
        const payload = normalizeSponsor(result);
        console.log(payload);
        this.saveTransferLogs(payload);
      } catch {
        // do nothing.
      }
    }
  };

  onTrasfer = async (error: any, result: any) => {
    if (!error) {
      try {
        setTimeout(async () => {
          if (!isZeroAddress(result)) {
            const contract = this.initilizeContract();
            const payload = await normalizeTransfer(result, contract);
            this.saveTransferLogs(payload);
          }
        }, 6000);
      } catch {
        // do nothing.
      }
    }
  };

  onTrasferStatusChange = async (error: any, result: any) => {
    if (!error) {
      try {
        const payload = normalizeTransferStatus(result);
        this.eventEmitter.emit('transfer.status.change', payload);
      } catch {
        // do nothing.
      }
    }
  };

  onClaimOwnership = async (error: any, result: any) => {
    if (!error) {
      try {
        const payload = normalizeClaimOwnership(result);
        this.eventEmitter.emit('claim.owner.ship', payload);
      } catch {
        // do nothing.
      }
    }
  };

  onCommentStatusChange = async (error: any, result: any) => {
    if (!error) {
      try {
        const payload = normalizeCommentStatusChange(result);
        console.log("payload [onCommentStatusChange]", payload);
        this.eventEmitter.emit('comment.status.change', payload);
      } catch {
        // do nothing.
      }
    }
  };
}

import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Transfer, TransferDocument } from 'src/schemas/transfer.schema';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { BLOCKCHAIN_NETWORK_URL, CONTRACT_ADDRESS, Events } from 'src/constant';
import * as contractAbi from 'src/contracts/abi.json';

const WINDOW_TIME = 1000;

@Injectable()
export class TransferService {

  timmer: NodeJS.Timeout | null | undefined;
  queues: any = {};

  constructor(
    @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
    private configService: ConfigService,
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
    return newTransferLog.save();
  }

  findAll(tokenId: string): Promise<Transfer[]> {
    return this.transferModel.find({ tokenId }).exec();
  }

  findOneByTransactionHash(transactionHash: string): Promise<Transfer> {
    return this.transferModel.findOne({ transactionHash }).exec();
  }

  initilizeContract(): ethers.Contract {
    console.log(this.configService.get<string>(BLOCKCHAIN_NETWORK_URL))
    console.log(this.configService.get<string>(CONTRACT_ADDRESS))
    const provider = new ethers.providers.JsonRpcProvider(
      this.configService.get<string>(BLOCKCHAIN_NETWORK_URL),
    );
    const contract = new ethers.Contract(
      this.configService.get<string>(CONTRACT_ADDRESS),
      contractAbi,
      provider,
    );
    return contract;
  }

  saveTransferLogs = async (payload: Transfer) => {
    if (!this.timmer) {
      this.timmer = setTimeout(async () => {
        const _queues: Transfer[] = Object.keys(this.queues).map(key => this.queues[key]);
        this.queues = {};
        this.timmer = null;

        for (let i = 0; i < _queues.length; i += 1) {
          try {
            console.log(Events.Acquire, _queues[i]);
            await this.create(_queues[i]);
          } catch (e) {
            console.log('[error]  ', e?.response || e);
          }
				}
        
      }, WINDOW_TIME);
    }
    this.queues[payload.transactionHash] = payload;
  };
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Transfer, TransferDocument } from 'src/schemas/transfer.schema';
import { ConfigService } from '@nestjs/config';
import { BLOCKCHAIN_NETWORK_URL, CONTRACT_ADDRESS } from 'src/constant';
import { socialNftAbi } from 'src/contracts/abi';
import { ParamsDto } from './dto/params';
import Web3 from 'web3';

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
      socialNftAbi,
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
            console.log('Acquire', _queues[i]);
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

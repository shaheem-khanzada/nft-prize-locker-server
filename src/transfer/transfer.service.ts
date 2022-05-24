import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Transfer, TransferDocument } from 'src/schemas/transfer.schema';
import { ConfigService } from '@nestjs/config';
import { BLOCKCHAIN_NETWORK_URL, CONTRACT_ADDRESS } from 'src/constant';
import { socialNftAbi } from 'src/contracts/abi';
import { ParamsDto } from './dto/params';
import Web3 from 'web3';
import { BigNumber } from 'ethers';

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
    if (error) {
      return;
    }
    const {
      transactionHash,
      event,
      returnValues: { videoId, seller, buyer, amount },
    } = result;
    console.log(event);
    try {
      const payload: Transfer = {
        from: seller,
        to: buyer,
        tokenId: videoId.toString(),
        amount: amount.toString(),
        transactionHash,
        timestamp: Date.now(),
        actionType: 'Sale'
      };
      console.log(payload);
      this.saveTransferLogs(payload);
    } catch {
      // do nothing.
    }
  }

  onMint = (error: any, result: any) => {
    if (error) {
      return;
    }
    const {
      transactionHash,
      event,
      returnValues: { videoId, minter, amount },
    } = result;
    console.log(event);
    try {
      const payload: Transfer = {
        from: '0x0000000000000000000000000000000000000000',
        to: minter,
        tokenId: videoId.toString(),
        amount: amount.toString(),
        transactionHash,
        timestamp: Date.now(),
        actionType: 'Mint'
      };
      console.log(payload);
      this.saveTransferLogs(payload);
    } catch {
      // do nothing.
    }
  }

  onSponsorshipMint = (error: any, result: any) => {
    if (error) {
      return;
    }
    const {
      transactionHash,
      event,
      returnValues: { videoId, sponsor, amount },
    } = result;
    console.log(event);
    try {
      const payload: Transfer = {
        from: '0x0000000000000000000000000000000000000000',
        to: sponsor,
        tokenId: videoId.toString(),
        amount: amount.toString(),
        transactionHash,
        timestamp: Date.now(),
        actionType: 'Sponsor'
      };
      console.log(payload);
      this.saveTransferLogs(payload);
    } catch {
      // do nothing.
    }
  }

  onTrasfer = async(error: any, result: any) => {
    if (error) {
      return;
    }
    const {
      event,
      transactionHash,
      returnValues: { from, to, tokenId },
    } = result;
    console.log(event, BigNumber.from(from).isZero());
    try {
      if (!BigNumber.from(from).isZero()) {
        const contract = this.initilizeContract();
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
          actionType: 'Transfer'
        };
        this.saveTransferLogs(payload);
      }
    } catch {
      // do nothing.
    }
  }
}

import {
  BadRequestException,
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import {
  WALLET_PRIVATE_KEY,
  YOUTUBE_BASE_URL,
  YOUTUBE_API_KEY,
} from 'src/constant';
import Web3 from 'web3';
import { HttpService } from '@nestjs/axios';
import normalizeVideoData from 'src/helper/normalizeVideoData';
import { SignBody } from './dto/signBody';
import { SignTypes } from 'src/constant/enums';

@Injectable()
export class SigningService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  getVideoById(
    videoId: string,
    callingfromServer: boolean = false
  ): any {
    const baseUrl = this.configService.get<string>(YOUTUBE_BASE_URL);
    const apiKey = this.configService.get<string>(YOUTUBE_API_KEY);
    if (callingfromServer) {
      return firstValueFrom(
        this.httpService.get(
          `${baseUrl}/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics,status`,
        ),
      );
    } else {
      return this.httpService.get(
        `${baseUrl}/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics,status`,
      ).pipe(
        map(response => response.data),
        catchError(() => {
          throw new HttpException('Video Not Found', HttpStatus.NOT_FOUND)
        })
      )
    }
  }

  getMintingPrice(viewCount: string) {
    const web3 = new Web3();
    const regularPrice: number = parseInt(viewCount) * 0.001;
    const reducedPrice: any =
      parseFloat((regularPrice / 1000).toFixed(3)) * 1000;
    return web3.utils.toWei(reducedPrice.toString());
  }

  async sendSignMessage(body: SignBody) {
    const { videoId, account, tokenId, type } = body;
    const web3 = new Web3();

    const {
      data: { items },
    } = await this.getVideoById(videoId, true);

    const video = normalizeVideoData(items);

    if(SignTypes[type] === SignTypes.acquire && !tokenId) {
      throw new BadRequestException('Required TokenId');
    }

    if (!web3.utils.isAddress(account)) {
      throw new BadRequestException('Invalid account address');
    }

    if (!(SignTypes[type] === type)) {
      throw new BadRequestException('Sign types must be one of [mint, acquire, sponsor]');
    }

    if (!Object.keys(video || {}).length) {
      throw new HttpException(
        `Video Not Found by id: ${videoId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const privateKey = this.configService.get<string>(WALLET_PRIVATE_KEY);
    let hash = '';

    if (type === 'mint' || type === 'sponsor') {
      hash = web3.utils.soliditySha3(
        { t: 'uint256', v: this.getMintingPrice(video.viewCount) },
        { t: 'string', v: videoId },
        { t: 'address', v: account },
      );
    }

    if (type === 'acquire') {
      hash = web3.utils.soliditySha3(
        { t: 'uint256', v: tokenId },
        { t: 'uint256', v: this.getMintingPrice(video.viewCount) },
        { t: 'address', v: account },
      );
    }

    if (type === 'claim') {
      hash = web3.utils.soliditySha3(
        { t: 'string', v: videoId },
        { t: 'address', v: account },
      );
    }

    const signature = web3.eth.accounts.sign(hash, privateKey);
    return signature;
  }
}

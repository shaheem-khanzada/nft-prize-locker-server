import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
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
import { Video, VideoDocument } from 'src/schemas/video.schema';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';

@Injectable()
export class SigningService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
    private eventEmitter: EventEmitter
  ) {}

  async saveVideoDetails(video: any) {
    const isAlreadyExist = await this.findOneByVideoId(video.videoId);
    if (isAlreadyExist) {
      this.eventEmitter.emit('videoUpdated', video);
      return this.videoModel
        .findOneAndUpdate({ videoId: video.videoId }, video, {
          new: true,
        })
        .exec();
    }
    const newVideo = new this.videoModel(video);
    this.eventEmitter.emit('videoUpdated', video);
    return newVideo.save();
  }

  findOneByVideoId(videoId: string): Promise<Video> {
    return this.videoModel.findOne({ videoId }).exec();
  }

  async getVideoById(
    videoId: string,
    callingfromServer: boolean = false,
  ): Promise<any> {
    const video = await this.findOneByVideoId(videoId);

    const baseUrl = this.configService.get<string>(YOUTUBE_BASE_URL);
    const apiKey = this.configService.get<string>(YOUTUBE_API_KEY);

    if (callingfromServer) {
      const response = await firstValueFrom(
        this.httpService.get(
          `${baseUrl}/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics,status`,
        ),
      );
      return normalizeVideoData(response.data.items, video);
    } else {
      return this.httpService
        .get(
          `${baseUrl}/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics,status`,
        )
        .pipe(
          map((response) => {
            const vid = normalizeVideoData(response.data.items, video);
            if (Object.keys(vid || {}).length) {
              this.eventEmitter.emit('videoUpdated', { ...vid, videoId });
              return vid;
            }
            throw new HttpException('Video Not Found', HttpStatus.NOT_FOUND);
          }),
          catchError(() => {
            throw new HttpException('Video Not Found', HttpStatus.NOT_FOUND);
          }),
        );
    }
  }

  getMintingPrice(viewCount: string) {
    const web3 = new Web3();
    const regularPrice: number = Number(viewCount) * 0.001;
    // @ts-ignore
    const reducedPrice: any = (regularPrice / 100).toFixed(3) * 100;
    if (reducedPrice <= 1) {
      return web3.utils.toWei('1.00');
    }
    return web3.utils.toWei(reducedPrice.toString());
  }

  async sendSignMessage(body: SignBody) {
    const { videoId, account, tokenId, type } = body;
    const web3 = new Web3();

    const video = await this.getVideoById(videoId, true);

    if (SignTypes[type] === SignTypes.acquire && !tokenId) {
      throw new BadRequestException('Required TokenId');
    }

    if (!web3.utils.isAddress(account)) {
      throw new BadRequestException('Invalid account address');
    }

    if (!(SignTypes[type] === type)) {
      throw new BadRequestException(
        'Sign types must be one of [mint, acquire, sponsor]',
      );
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
        { t: 'uint256', v: this.getMintingPrice(video?.transferViewCount || video.viewCount) },
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
    const videoPayload = { viewCount: video.viewCount, videoId };
    this.eventEmitter.emit('videoUpdated', videoPayload);
    return { signature };
  }
}

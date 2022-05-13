import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Historical, HistoricalDocument } from 'src/schemas/historical.schema';
import { NotFoundException } from '@nestjs/common';
import { ParamsDto } from 'src/transfer/dto/params';

@Injectable()
export class HistoricalService {
  constructor(
    @InjectModel(Historical.name)
    private historicalModel: Model<HistoricalDocument>,
  ) {}

  create(historicalInfo: Historical) {
    const newHistoricalInfo = new this.historicalModel(historicalInfo);
    newHistoricalInfo.save();
    return newHistoricalInfo;
  }

  findAll(tokenId: ParamsDto): Promise<Historical[]> {
    if (typeof(tokenId) === 'string') {
      return this.historicalModel.find({ tokenId }).exec();
    }
    throw new HttpException('expected string tokenId', HttpStatus.FOUND);
  }

  async findOne(id: string) {
    let historical = undefined;
    try {
      historical = await this.historicalModel.findById(id);
    } catch (e) {
      throw new NotFoundException('Historical not found');
    }
    if (!historical) {
      throw new NotFoundException('Historical not found');
    }
    return historical;
  }

  async update(id: string, body: Partial<Historical>){
    const comment = await this.historicalModel.findByIdAndUpdate(id, body, {
      new: true
    })
    if (!comment) {
      return new NotFoundException();
    }
    return comment;
}

  remove(id: string) {
    return this.historicalModel.deleteOne({ _id: id }).exec();
  }
}

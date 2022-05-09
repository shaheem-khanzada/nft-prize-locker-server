import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Historical, HistoricalDocument } from 'src/schemas/historical.schema';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class HistoricalService {
  constructor(
    @InjectModel(Historical.name)
    private historicalModel: Model<HistoricalDocument>,
  ) {}

  create(historicalInfo: Historical) {
    const newHistoricalInfo = new this.historicalModel(historicalInfo);
    return newHistoricalInfo.save();
  }

  findAll(tokenId: string): Promise<Historical[]> {
    return this.historicalModel.find({ tokenId }).exec();
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

  async update(id: string, body: Partial<Historical>) {
    let historical = await this.findOne(id);
    Object.assign(historical, body);
    return historical.save();
  }

  remove(id: string) {
    return this.historicalModel.deleteOne({ _id: id }).exec();
  }
}

import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Historical, HistoricalDocument } from 'src/schemas/historical.schema';
import { NotFoundException } from '@nestjs/common';
import { ParamsDto } from './dto/params';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';

@Injectable()
export class HistoricalService {
  constructor(
    @InjectModel(Historical.name)
    private historicalModel: Model<HistoricalDocument>,
    private eventEmitter: EventEmitter
  ) {}

  create(historicalInfo: Historical) {
    const newHistoricalInfo = new this.historicalModel(historicalInfo);
    newHistoricalInfo.save();
    this.eventEmitter.emit('comment.created', newHistoricalInfo);
    return newHistoricalInfo;
  }

  findAll(params: ParamsDto): Promise<Historical[]> {
    return this.historicalModel.find({ tokenId: params.tokenId }).exec();
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
    this.eventEmitter.emit('comment.updated', comment);
    return comment;
}

  async remove(id: string) {
    const comment = await this.historicalModel.deleteOne({ _id: id }).exec();
    this.eventEmitter.emit('comment.deleted', comment);
    return comment;
  }
}

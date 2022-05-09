import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty } from 'class-validator';

export type HistoricalDocument = Historical & Document;

@Schema()
export class Historical {

  @IsNotEmpty()
  @Prop({ required: true })
  comment: string;

  @IsNotEmpty()
  @Prop({ required: true })
  address: string;

  @IsNotEmpty()
  @Prop({ required: true })
  tokenId: number;

  @Prop()
  timestamp: number;
}

export const HistoricalSchema = SchemaFactory.createForClass(Historical);

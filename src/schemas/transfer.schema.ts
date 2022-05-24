import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty } from 'class-validator';


export type TransferDocument = Transfer & Document;

@Schema()
export class Transfer {

  @IsNotEmpty()
  @Prop({ required: true })
  from: string;

  @IsNotEmpty()
  @Prop({ required: true })
  to: string;

  @IsNotEmpty()
  @Prop({ required: true })
  actionType: string;

  @IsNotEmpty()
  @Prop({ required: true })
  transactionHash: string;

  @IsNotEmpty()
  @Prop({ required: true })
  tokenId: string;

  @IsNotEmpty()
  @Prop({ required: true })
  amount: string;

  @IsNotEmpty()
  @Prop({ required: true })
  timestamp: number;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

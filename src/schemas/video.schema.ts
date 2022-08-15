import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty } from 'class-validator';

export type VideoDocument = Video & Document;

@Schema()
export class Video {

  @IsNotEmpty()
  @Prop({ required: true })
  videoId: string;

  @IsNotEmpty()
  @Prop({ required: true })
  viewCount: string;

}

export const VideoSchema = SchemaFactory.createForClass(Video);

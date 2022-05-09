import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HistoricalModule } from './historical/historical.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferModule } from './transfer/transfer.module';
import configuration from './config/configuration';
import { MONGODB_URI } from './constant';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/${process.env.NODE_ENV}.env`,
      load: [configuration],
      isGlobal: true
    }),
    HistoricalModule, 
    TransferModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(MONGODB_URI),
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

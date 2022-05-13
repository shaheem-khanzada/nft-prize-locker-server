import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Historical } from 'src/schemas/historical.schema';
import { ParamsDto } from './dto/params';
import { HistoricalService } from './historical.service';

@Controller('historical')
export class HistoricalController {
  constructor(private readonly historicalService: HistoricalService) {}

  @Post()
  create(@Body() body: Historical) {
    return this.historicalService.create(body);
  }

  @Get(':tokenId')
  findAll(@Param() params: ParamsDto) {
    return this.historicalService.findAll(params);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Historical>) {
    return this.historicalService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historicalService.remove(id);
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { SigningController } from './signing.controller';
import { SigningService } from './signing.service';

describe('SigningController', () => {
  let controller: SigningController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SigningController],
      providers: [SigningService],
    }).compile();

    controller = module.get<SigningController>(SigningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

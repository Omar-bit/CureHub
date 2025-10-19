import { Test, TestingModule } from '@nestjs/testing';
import { PatientDocumentsController } from './patient-documents.controller';

describe('PatientDocumentsController', () => {
  let controller: PatientDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientDocumentsController],
    }).compile();

    controller = module.get<PatientDocumentsController>(PatientDocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

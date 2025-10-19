import { Test, TestingModule } from '@nestjs/testing';
import { PatientDocumentsService } from './patient-documents.service';

describe('PatientDocumentsService', () => {
  let service: PatientDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientDocumentsService],
    }).compile();

    service = module.get<PatientDocumentsService>(PatientDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

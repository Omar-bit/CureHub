import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateMessageDto } from './dto/generate-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-message')
  @HttpCode(HttpStatus.OK)
  async generateMessage(@Body() dto: GenerateMessageDto) {
    if (!this.aiService.isConfigured()) {
      throw new BadRequestException(
        'AI service is not configured. Please contact the administrator.',
      );
    }

    try {
      let message: string;

      if (dto.type === 'email') {
        message = await this.aiService.generateProfessionalEmail({
          description: dto.description,
          patientName: dto.patientName,
          doctorName: dto.doctorName || 'Dr.',
          clinicName: dto.clinicName,
          language: dto.language,
        });
      } else {
        message = await this.aiService.generateProfessionalSMS({
          description: dto.description,
          patientName: dto.patientName,
          doctorName: dto.doctorName || 'Dr.',
          clinicName: dto.clinicName,
          language: dto.language,
        });
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to generate message',
      );
    }
  }

  @Post('check-status')
  @HttpCode(HttpStatus.OK)
  checkStatus() {
    return {
      configured: this.aiService.isConfigured(),
    };
  }
}

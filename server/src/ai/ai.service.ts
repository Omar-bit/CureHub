import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GenerateContentOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. AI features will not work.',
      );
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateContent(
    prompt: string,
    options: GenerateContentOptions = {},
  ): Promise<string> {
    const {
      model = this.defaultModel,
      systemInstruction,
      temperature = 0.7,
      maxOutputTokens = 2048,
    } = options;

    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const url = `${this.apiUrl}/${model}:generateContent`;

    // Combine system instruction with prompt since v1 API doesn't support systemInstruction field
    const fullPrompt = systemInstruction
      ? `${systemInstruction}\n\n---\n\n${prompt}`
      : prompt;

    const requestBody: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      //   generationConfig: {
      //     temperature,
      //     maxOutputTokens,
      //   },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `Gemini API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No text content in Gemini response');
      }

      return text;
    } catch (error) {
      this.logger.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generateProfessionalEmail(params: {
    description: string;
    patientName: string;
    doctorName: string;
    clinicName?: string;
    language?: string;
  }): Promise<string> {
    const {
      description,
      patientName,
      doctorName,
      clinicName = '',
      language = 'fr',
    } = params;

    const languageInstructions =
      language === 'fr'
        ? 'Répondez uniquement en français.'
        : 'Respond only in English.';

    const systemInstruction = `You are a professional medical communication assistant. Your task is to generate professional, empathetic, and clear email messages for a medical practice.

Guidelines:
- Be professional but warm and caring
- Use appropriate medical terminology when needed, but keep the message accessible
- Be concise and clear
- Include a proper greeting and closing
- Do not include a subject line, only the email body
- ${languageInstructions}
- The email is from ${doctorName}${clinicName ? ` at ${clinicName}` : ''}
- The email is addressed to ${patientName}`;

    const prompt = `Generate a professional medical email based on the following request:

"${description}"

Patient: ${patientName}
Doctor: ${doctorName}
${clinicName ? `Clinic: ${clinicName}` : ''}

Generate only the email body content, ready to send. Do not include any explanations or metadata.`;

    return this.generateContent(prompt, {
      systemInstruction,
      temperature: 0.7,
    });
  }

  async generateProfessionalSMS(params: {
    description: string;
    patientName: string;
    doctorName: string;
    clinicName?: string;
    language?: string;
  }): Promise<string> {
    const {
      description,
      patientName,
      doctorName,
      clinicName = '',
      language = 'fr',
    } = params;

    const languageInstructions =
      language === 'fr'
        ? 'Répondez uniquement en français.'
        : 'Respond only in English.';

    const systemInstruction = `You are a professional medical communication assistant. Your task is to generate concise, professional SMS messages for a medical practice.

Guidelines:
- Keep the message very short (under 160 characters if possible, max 320 characters)
- Be professional but friendly
- Be direct and clear
- Do not use excessive abbreviations
- ${languageInstructions}
- Sign the message appropriately`;

    const prompt = `Generate a professional medical SMS based on the following request:

"${description}"

Patient: ${patientName}
Doctor: ${doctorName}
${clinicName ? `Clinic: ${clinicName}` : ''}

Generate only the SMS content, ready to send. Keep it concise. Do not include any explanations or metadata.`;

    return this.generateContent(prompt, {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 256,
    });
  }
}

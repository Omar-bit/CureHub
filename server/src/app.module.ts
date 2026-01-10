import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { OtpModule } from './otp/otp.module';
import { DoctorProfileModule } from './doctor-profile/doctor-profile.module';
import { ClinicModule } from './clinic/clinic.module';
import { PatientModule } from './patient/patient.module';
import { ConsultationTypesModule } from './consultation-types/consultation-types.module';
import { TimeplanModule } from './timeplan/timeplan.module';
import { AppointmentModule } from './appointment/appointment.module';
import { TaskModule } from './task/task.module';
import { EventModule } from './event/event.module';
import { PatientDocumentsModule } from './patient-documents/patient-documents.module';
import { AppointmentDocumentsModule } from './appointment-documents/appointment-documents.module';
import { ImprevuModule } from './imprevu/imprevu.module';
import { AgendaPreferencesModule } from './agenda-preferences/agenda-preferences.module';
import { PTOModule } from './pto/pto.module';
import { AiModule } from './ai/ai.module';
import { ModeExerciceModule } from './mode-exercice/mode-exercice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '..', '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    EmailModule,
    OtpModule,
    DoctorProfileModule,
    ClinicModule,
    PatientModule,
    ConsultationTypesModule,
    TimeplanModule,
    AppointmentModule,
    TaskModule,
    EventModule,
    PatientDocumentsModule,
    AppointmentDocumentsModule,
    ImprevuModule,
    AgendaPreferencesModule,
    PTOModule,
    AiModule,
    ModeExerciceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

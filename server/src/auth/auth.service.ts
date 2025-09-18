import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { UserService, CreateUserDto } from '../user/user.service';
import { User, UserRole } from '@prisma/client';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private i18n: I18nService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (
      user &&
      (await this.userService.validatePassword(password, user.password))
    ) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto, lang?: string): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      const message = await this.i18n.t('errors.user.invalidCredentials', {
        lang,
      });
      throw new UnauthorizedException(message);
    }

    if (!user.isActive) {
      const message = await this.i18n.t('errors.user.unauthorized', { lang });
      throw new UnauthorizedException(message);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async register(
    registerDto: RegisterDto,
    lang?: string,
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      const message = await this.i18n.t('errors.user.emailExists', { lang });
      throw new ConflictException(message);
    }

    // Create new user
    const user = await this.userService.create(registerDto);

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

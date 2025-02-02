import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  registerUser(@Payload() registerUserDto: RegisterUserDto){
    return this.authService.registerUser(registerUserDto)
  }

  @MessagePattern('auth.login.user')
  login(@Payload() loginUserDto: LoginUserDto){
    return this.authService.loginUser(loginUserDto)
  }

  @MessagePattern('auth.verify.user')
  verfify(@Payload() token: string){
    return this.authService.verifyToken(token)
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { envs } from 'src/config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService
    ){
        super();
    }

    onModuleInit() {
        this.$connect();
        this.logger.log('MongoDB connected');
    }

    async signJWT(payload: JwtPayload){
        return this.jwtService.sign(payload);
    }

    async registerUser(registerUserDto: RegisterUserDto){
        const { email, name, password } = registerUserDto;
        try {
            const user = await this.user.findUnique({
                where: {
                    email
                }
            });
            if(user){
                throw new RpcException({
                    status: 400,
                    message: 'User already exists'
                })
            }
            const newUser = await this.user.create({
                data: {
                    email,
                    name,
                    password: bcrypt.hashSync(password, 10)
                }
            });
            const {password: _, ...userWithoutPassword} = newUser;
            return {
                user: userWithoutPassword,
                token: await this.signJWT(userWithoutPassword)
            }
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }

    async loginUser(loginUserDto: LoginUserDto){
        const { email, password } = loginUserDto;
        try {
            const user = await this.user.findUnique({
                where: {
                    email
                }
            });
            if(!user){
                throw new RpcException({
                    status: 400,
                    message: 'Invalid credentials'
                })
            }
            const isPasswordValidad = bcrypt.compareSync(password, user.password);
            if(!isPasswordValidad){
                throw new RpcException({
                    status: 400,
                    message: 'Invalid credentials'
                })
            }
            const {password: _, ...userWithoutPassword} = user;
            return {
                user: userWithoutPassword,
                token: await this.signJWT(userWithoutPassword)
            }
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }

    async verifyToken(token: string){
        try {
            const {sub, iat, exp, ...user} = this.jwtService.verify(token, {
                secret: envs.jwtSecret
            });
            return {
                user,
                token: await this.signJWT(user)
            }
        } catch (error) {
            throw new RpcException({
                status: 401,
                message: 'Invalid token'
            })
        }
    }

}

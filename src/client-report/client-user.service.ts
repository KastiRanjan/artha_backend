import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { ClientUser, ClientUserStatus } from './entities/client-user.entity';
import {
  CreateClientUserDto,
  UpdateClientUserDto,
  ClientLoginDto,
  ClientResetPasswordDto,
  ClientForgotPasswordDto,
  ClientChangePasswordDto
} from './dto/client-user.dto';
import { MailService } from 'src/mail/mail.service';
import { Customer } from 'src/customers/entities/customer.entity';

@Injectable()
export class ClientUserService {
  constructor(
    @InjectRepository(ClientUser)
    private readonly clientUserRepository: Repository<ClientUser>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  /**
   * Create a new client user (Admin only)
   */
  async create(
    createDto: CreateClientUserDto,
    createdBy: string
  ): Promise<ClientUser> {
    // Check if email already exists
    const existing = await this.clientUserRepository.findOne({
      where: { email: createDto.email }
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Find all customers
    const customers = await this.customerRepository.find({
      where: { id: In(createDto.customerIds) }
    });

    if (customers.length !== createDto.customerIds.length) {
      throw new BadRequestException('One or more customers not found');
    }

    const user = this.clientUserRepository.create({
      email: createDto.email,
      name: createDto.name,
      phoneNumber: createDto.phoneNumber,
      customers: customers,
      createdBy
    });

    // Hash password
    user.salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(createDto.password, user.salt);

    return this.clientUserRepository.save(user);
  }

  /**
   * Client login
   */
  async login(
    loginDto: ClientLoginDto
  ): Promise<{ token: string; user: Partial<ClientUser>; customers: Customer[] }> {
    const user = await this.clientUserRepository.findOne({
      where: { email: loginDto.email },
      relations: ['customers']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== ClientUserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Your account is not active. Please contact support.'
      );
    }

    const isValid = await user.validatePassword(loginDto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // If customerId provided, validate it belongs to this user
    let selectedCustomerId = loginDto.customerId;
    if (selectedCustomerId) {
      const hasAccess = user.customers.some(c => c.id === selectedCustomerId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this customer');
      }
    } else if (user.customers.length === 1) {
      // Auto-select if only one customer
      selectedCustomerId = user.customers[0].id;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.clientUserRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      customerId: selectedCustomerId, // May be undefined if multiple customers
      type: 'client'
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h'
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        customers: user.customers,
        status: user.status
      },
      customers: user.customers
    };
  }

  /**
   * Switch to a different customer (generates new token)
   */
  async switchCustomer(
    userId: string,
    customerId: string
  ): Promise<{ token: string; customer: Customer }> {
    const user = await this.clientUserRepository.findOne({
      where: { id: userId },
      relations: ['customers']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customer = user.customers.find(c => c.id === customerId);
    if (!customer) {
      throw new ForbiddenException('You do not have access to this customer');
    }

    // Generate new JWT token with selected customer
    const payload = {
      sub: user.id,
      email: user.email,
      customerId: customerId,
      type: 'client'
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h'
    });

    return { token, customer };
  }

  /**
   * Get current client user profile
   */
  async getProfile(userId: string): Promise<ClientUser> {
    const user = await this.clientUserRepository.findOne({
      where: { id: userId },
      relations: ['customers']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find all client users (Admin view)
   */
  async findAll(customerId?: string): Promise<ClientUser[]> {
    const query = this.clientUserRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customers', 'customers')
      .orderBy('user.createdAt', 'DESC');

    if (customerId) {
      query.where('customers.id = :customerId', { customerId });
    }

    return query.getMany();
  }

  /**
   * Find client user by ID
   */
  async findOne(id: string): Promise<ClientUser> {
    const user = await this.clientUserRepository.findOne({
      where: { id },
      relations: ['customers']
    });

    if (!user) {
      throw new NotFoundException('Client user not found');
    }

    return user;
  }

  /**
   * Update client user (Admin only)
   */
  async update(
    id: string,
    updateDto: UpdateClientUserDto,
    updatedBy: string
  ): Promise<ClientUser> {
    const user = await this.findOne(id);

    // Update customer associations if provided
    if (updateDto.customerIds) {
      const customers = await this.customerRepository.find({
        where: { id: In(updateDto.customerIds) }
      });

      if (customers.length !== updateDto.customerIds.length) {
        throw new BadRequestException('One or more customers not found');
      }

      user.customers = customers;
    }

    // Update other fields
    if (updateDto.name) user.name = updateDto.name;
    if (updateDto.phoneNumber) user.phoneNumber = updateDto.phoneNumber;
    if (updateDto.status) user.status = updateDto.status;
    user.updatedBy = updatedBy;

    return this.clientUserRepository.save(user);
  }

  /**
   * Delete client user (Admin only)
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.clientUserRepository.remove(user);
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(forgotDto: ClientForgotPasswordDto): Promise<void> {
    const user = await this.clientUserRepository.findOne({
      where: { email: forgotDto.email }
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    user.token = uuid();
    user.tokenValidityDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await this.clientUserRepository.save(user);

    // Send email
    const frontendUrl = process.env.FRONTEND_URL;
    await this.mailService.sendMail(
      {
        to: user.email,
        subject: 'Reset Your Password',
        slug: 'client-password-reset',
        context: {
          name: user.name,
          link: `<a href="${frontendUrl}/client/reset-password/${user.token}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password →</a>`,
          companyName: process.env.COMPANY_NAME || 'Artha'
        }
      },
      'system-mail'
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetDto: ClientResetPasswordDto): Promise<void> {
    const user = await this.clientUserRepository.findOne({
      where: { token: resetDto.token }
    });

    if (!user || user.tokenValidityDate < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    user.salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(resetDto.password, user.salt);
    user.token = null;
    user.tokenValidityDate = null;

    await this.clientUserRepository.save(user);
  }

  /**
   * Change password (authenticated client)
   */
  async changePassword(
    userId: string,
    changeDto: ClientChangePasswordDto
  ): Promise<void> {
    const user = await this.findOne(userId);

    const isValid = await user.validatePassword(changeDto.currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(changeDto.newPassword, user.salt);

    await this.clientUserRepository.save(user);
  }

  /**
   * Validate client JWT token
   */
  async validateToken(token: string): Promise<ClientUser | null> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'client') {
        return null;
      }

      return this.findOne(payload.sub);
    } catch {
      return null;
    }
  }
}

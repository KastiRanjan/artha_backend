import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * Request-scoped service that provides the current HTTP request context
 * to the audit log subscriber. This allows us to capture the user ID,
 * IP address, and user agent for each audit log entry.
 *
 * We use a singleton holder pattern since TypeORM subscribers cannot be
 * request-scoped directly (they are singleton by nature).
 */

/**
 * Static holder for the current request context.
 * Uses AsyncLocalStorage-like pattern via NestJS middleware.
 */
export class AuditContext {
  private static currentUserId: string | null = null;
  private static currentUserName: string | null = null;
  private static currentIpAddress: string | null = null;
  private static currentUserAgent: string | null = null;

  static setContext(
    userId: string | null,
    userName: string | null,
    ipAddress: string | null,
    userAgent: string | null
  ): void {
    AuditContext.currentUserId = userId;
    AuditContext.currentUserName = userName;
    AuditContext.currentIpAddress = ipAddress;
    AuditContext.currentUserAgent = userAgent;
  }

  static updateUser(userId: string | null, userName: string | null): void {
    if (userId) AuditContext.currentUserId = userId;
    if (userName) AuditContext.currentUserName = userName;
  }

  static getUserId(): string | null {
    return AuditContext.currentUserId;
  }

  static getUserName(): string | null {
    return AuditContext.currentUserName;
  }

  static getIpAddress(): string | null {
    return AuditContext.currentIpAddress;
  }

  static getUserAgent(): string | null {
    return AuditContext.currentUserAgent;
  }

  static clear(): void {
    AuditContext.currentUserId = null;
    AuditContext.currentUserName = null;
    AuditContext.currentIpAddress = null;
    AuditContext.currentUserAgent = null;
  }
}

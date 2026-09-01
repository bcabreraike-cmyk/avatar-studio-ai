// packages/backend/src/services/auth.service.ts

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Validate API key and return user data
   * Returns developer status for keys starting with 'dev_'
   */
  async validateApiKey(apiKey: string) {
    // Check if it's a developer key (unlimited access)
    if (apiKey.startsWith('dev_')) {
      return {
        isDeveloper: true,
        userId: 'DEVELOPER',
        email: 'developer@avatarstudio.ai',
        subscription: 'developer',
        isUnlimited: true,
      };
    }

    // Query database for API key
    const user = await prisma.user.findUnique({
      where: { apiKey },
      include: { subscription: true },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new Error('Invalid or expired API key');
    }

    // Update last used time
    await prisma.apiKey.updateMany({
      where: { key: apiKey },
      data: { lastUsedAt: new Date() },
    });

    return {
      isDeveloper: false,
      userId: user.id,
      email: user.email,
      subscription: user.subscriptionPlan,
      isUnlimited: false,
    };
  }

  /**
   * Generate new API key for user
   */
  generateApiKey(): string {
    return `api_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate developer API key (one-time setup)
   */
  generateDeveloperKey(): string {
    return `dev_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Create user account
   */
  async createUser(email: string, passwordHash: string, name?: string) {
    const apiKey = this.generateApiKey();

    return prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        apiKey,
        subscriptionPlan: 'STARTER', // Default to starter plan
        accountStatus: 'ACTIVE',
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });
  }

  /**
   * Regenerate API key for user
   */
  async regenerateApiKey(userId: string) {
    const newApiKey = this.generateApiKey();

    return prisma.user.update({
      where: { id: userId },
      data: {
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date(),
      },
    });
  }
}

export default new AuthService();

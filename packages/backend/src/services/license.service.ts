// packages/backend/src/services/license.service.ts

import { PrismaClient, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckLimitResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

export class LicenseService {
  /**
   * Plan limits configuration
   */
  private readonly PLAN_LIMITS = {
    DEVELOPER: {
      avatarsPerMonth: Infinity,
      scenesPerMonth: Infinity,
      videosPerMonth: Infinity,
      objectsPerMonth: Infinity,
      storageGb: Infinity,
      requestsPerMinute: Infinity,
      maxConcurrent: Infinity,
    },
    STARTER: {
      avatarsPerMonth: 100,
      scenesPerMonth: 50,
      videosPerMonth: 25,
      objectsPerMonth: 20,
      storageGb: 5,
      requestsPerMinute: 10,
      maxConcurrent: 1,
    },
    PRO: {
      avatarsPerMonth: 1000,
      scenesPerMonth: 500,
      videosPerMonth: 250,
      objectsPerMonth: 200,
      storageGb: 100,
      requestsPerMinute: 50,
      maxConcurrent: 3,
    },
    ENTERPRISE: {
      avatarsPerMonth: Infinity,
      scenesPerMonth: Infinity,
      videosPerMonth: Infinity,
      objectsPerMonth: Infinity,
      storageGb: Infinity,
      requestsPerMinute: Infinity,
      maxConcurrent: Infinity,
    },
  };

  /**
   * Check if user can make a request based on their plan
   */
  async checkUsageLimit(
    userId: string,
    taskType: 'avatar' | 'scene' | 'video' | 'object' | 'marketing'
  ): Promise<CheckLimitResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Developer has unlimited access
    if (user.subscriptionPlan === 'DEVELOPER') {
      return { allowed: true };
    }

    // Get current month's usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await prisma.monthlyUsage.findFirst({
      where: {
        userId,
        month: monthStart,
      },
    });

    const limits = this.PLAN_LIMITS[user.subscriptionPlan as SubscriptionPlan];

    // Check limits based on task type
    const taskKey = `${taskType}Count` as keyof typeof usage;
    const limitKey = `${taskType}sPerMonth` as keyof typeof limits;

    const currentUsage = usage?.[taskKey as any] || 0;
    const limit = limits[limitKey as any] || 0;

    if (currentUsage >= limit) {
      return {
        allowed: false,
        reason: `${taskType} limit reached (${currentUsage}/${limit} per month)`,
      };
    }

    return {
      allowed: true,
      remaining: limit - currentUsage,
    };
  }

  /**
   * Log usage for tracking
   */
  async logUsage(
    userId: string,
    taskType: string,
    status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED',
    responseTime: number
  ) {
    // Log to usage_logs table
    await prisma.usageLog.create({
      data: {
        userId,
        endpoint: `/api/${taskType.split('-')[0]}/${taskType}`,
        taskType,
        status,
        responseTimeMs: responseTime,
        timestamp: new Date(),
      },
    });

    // Update monthly_usage if successful
    if (status === 'SUCCESS') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const updateData: any = {};
      const countKey = `${taskType}Count`;
      updateData[countKey] = { increment: 1 };

      await prisma.monthlyUsage.upsert({
        where: {
          userId_month: {
            userId,
            month: monthStart,
          },
        },
        update: updateData,
        create: {
          userId,
          month: monthStart,
          [countKey]: 1,
        },
      });
    }
  }

  /**
   * Get usage stats for a user in current month
   */
  async getMonthlyUsage(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await prisma.monthlyUsage.findFirst({
      where: {
        userId,
        month: monthStart,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const limits = this.PLAN_LIMITS[user?.subscriptionPlan as SubscriptionPlan];

    return {
      plan: user?.subscriptionPlan,
      month: monthStart,
      usage: {
        avatars: usage?.avatarCount || 0,
        scenes: usage?.sceneCount || 0,
        videos: usage?.videoCount || 0,
        objects: usage?.objectCount || 0,
        marketing: usage?.marketingCount || 0,
        storageGb: usage?.storageUsedGb || 0,
      },
      limits: {
        avatars: limits.avatarsPerMonth,
        scenes: limits.scenesPerMonth,
        videos: limits.videosPerMonth,
        objects: limits.objectsPerMonth,
        storage: limits.storageGb,
      },
      remaining: {
        avatars:
          limits.avatarsPerMonth === Infinity
            ? Infinity
            : limits.avatarsPerMonth - (usage?.avatarCount || 0),
        scenes:
          limits.scenesPerMonth === Infinity
            ? Infinity
            : limits.scenesPerMonth - (usage?.sceneCount || 0),
        videos:
          limits.videosPerMonth === Infinity
            ? Infinity
            : limits.videosPerMonth - (usage?.videoCount || 0),
        objects:
          limits.objectsPerMonth === Infinity
            ? Infinity
            : limits.objectsPerMonth - (usage?.objectCount || 0),
        storage:
          limits.storageGb === Infinity
            ? Infinity
            : limits.storageGb - (usage?.storageUsedGb || 0),
      },
    };
  }

  /**
   * Get plan limits
   */
  getPlanLimits(plan: SubscriptionPlan) {
    return this.PLAN_LIMITS[plan];
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Developer is always active
    if (user.subscriptionPlan === 'DEVELOPER') return true;

    // Check subscription status
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    return subscription?.status === 'ACTIVE';
  }
}

export default new LicenseService();

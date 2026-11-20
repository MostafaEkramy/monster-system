import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden relative group hover:border-[#8EDB2A]/50 transition-all duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-secondary">{title}</p>
            <div className="text-2xl font-bold tracking-tight text-primary">
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                <span>{trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%</span>
                <span className="text-muted">vs last period</span>
              </p>
            )}
          </div>
          {Icon && (
            <div className="h-12 w-12 rounded-xl bg-[#8EDB2A]/10 border border-[#8EDB2A]/20 flex items-center justify-center text-[#8EDB2A] group-hover:scale-105 transition-transform">
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

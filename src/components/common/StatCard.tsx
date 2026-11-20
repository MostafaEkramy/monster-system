import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tag?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  tag,
  icon: Icon,
  trend,
  onClick,
  className,
}: StatCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border-color bg-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2CEE55] hover:shadow-[0_12px_35px_-8px_rgba(44,238,85,0.22)] cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon ? (
          <div className="h-12 w-12 rounded-xl bg-[#121F16] border border-[#1E3324] flex items-center justify-center text-[#2CEE55] group-hover:bg-[#2CEE55] group-hover:text-black group-hover:shadow-[0_0_20px_rgba(44,238,85,0.4)] group-hover:scale-105 transition-all duration-300">
            <Icon className="h-6 w-6 transition-transform group-hover:rotate-3" />
          </div>
        ) : (
          <div />
        )}

        {tag && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#121F16] text-[#2CEE55] border border-[#1E3324]">
            {tag}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-secondary group-hover:text-primary transition-colors">
          {title}
        </h4>
        <div className="text-3xl font-black text-primary group-hover:text-[#2CEE55] transition-colors tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted pt-0.5">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs font-semibold flex items-center gap-1 pt-1',
              trend.isPositive ? 'text-[#2CEE55]' : 'text-red-400'
            )}
          >
            <span>{trend.isPositive ? '↑ +' : '↓ -'}{Math.abs(trend.value)}%</span>
            <span className="text-muted font-normal">vs last period</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 mt-3 border-t border-border-color/60 text-xs font-semibold text-muted group-hover:text-[#2CEE55] transition-colors">
        <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Card>
  );
}

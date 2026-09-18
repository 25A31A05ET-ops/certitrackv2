import React from 'react';

interface StatsCardProps {
  id?: string;
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  id,
  title,
  value,
  description,
  icon,
  highlight = false,
}) => {
  return (
    <div
      id={id}
      className={`bg-white rounded p-5 border transition-all ${
        highlight
          ? 'border-[#9D174D] ring-1 ring-[#9D174D]/20 shadow-sm'
          : 'border-[#E5E7EB] hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className="w-8 h-8 rounded bg-[#9D174D]/5 text-[#9D174D] flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-[#111827]">
          {value}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

'use client';

import { Angle } from '@/lib/types';
import { useMemo } from 'react';

interface AngleCardProps {
  angle: Angle;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

const MOTIVATOR_COLORS = ['#8b5cf6', '#6366f1', '#7c3aed'];
const CHARACTERISTIC_COLORS = ['#0ea5e9', '#3b82f6', '#06b6d4'];

const PSYCHOLOGY_COLORS: Record<string, string> = {
  contrast: '#f59e0b',
  'social-proof': '#10b981',
  urgency: '#ef4444',
  'fear-of-missing-out': '#f97316',
  authority: '#6366f1',
  mythbusting: '#8b5cf6',
  'problem-discovery': '#ec4899',
  convenience: '#14b8a6',
  storytelling: '#a855f7',
  identity: '#3b82f6',
  scarcity: '#e11d48',
};

export default function AngleCard({
  angle,
  onClick,
  selected,
  onToggleSelect,
}: AngleCardProps) {
  const displayHook = useMemo(() => {
    if (!angle.hooks || angle.hooks.length === 0) return null;
    const idx = Math.floor(Math.random() * angle.hooks.length);
    return angle.hooks[idx];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle.id]);

  const productColor = angle.product?.color || '#8b5cf6';
  const segmentTags = (angle.segment_tags || []) as string[];
  const psychologyTags = (angle.psychology_tags || []) as string[];

  return (
    <div
      className="group cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="inline-block rounded-md px-2 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: productColor }}
        >
          {angle.product?.short_code || '???'}
        </span>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(angle.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
      </div>

      <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2">
        {angle.title}
      </h3>

      <p className="text-sm text-gray-500 mb-3 line-clamp-3">
        {angle.description}
      </p>

      {displayHook && (
        <div
          className="rounded-lg px-3 py-2.5 mb-3 text-sm italic leading-relaxed"
          style={{
            backgroundColor: `${productColor}10`,
            borderLeft: `3px solid ${productColor}`,
            color: '#4b5563',
          }}
        >
          &ldquo;{displayHook}&rdquo;
        </div>
      )}

      {segmentTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {segmentTags.map((tag, i) => {
            const color =
              i < MOTIVATOR_COLORS.length
                ? MOTIVATOR_COLORS[i % MOTIVATOR_COLORS.length]
                : CHARACTERISTIC_COLORS[i % CHARACTERISTIC_COLORS.length];
            return (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {psychologyTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {psychologyTags.map((tag) => {
            const color = PSYCHOLOGY_COLORS[tag] || '#6b7280';
            return (
              <span
                key={tag}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${color}12`,
                  color: color,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

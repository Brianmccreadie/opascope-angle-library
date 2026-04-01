'use client';

import { Angle } from '@/lib/types';
import { useState } from 'react';
import { buildBriefPrompt } from '@/lib/prompts';

interface AngleDetailModalProps {
  angle: Angle;
  onClose: () => void;
  onBriefCopied?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  symptom: '#ef4444',
  problem: '#f97316',
  solution: '#f59e0b',
  product: '#10b981',
  offer: '#6366f1',
};

const STATUS_COLORS: Record<string, string> = {
  untested: '#6b7280',
  testing: '#f59e0b',
  winner: '#10b981',
  fatigued: '#f97316',
  retired: '#ef4444',
};

export default function AngleDetailModal({
  angle,
  onClose,
  onBriefCopied,
}: AngleDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const productColor = angle.product?.color || '#8b5cf6';
  const segmentTags = (angle.segment_tags || []) as string[];
  const psychologyTags = (angle.psychology_tags || []) as string[];
  // hooks can be strings or objects with a .hook property
  const hooks = (angle.hooks || []).map((h: unknown) => {
    if (typeof h === 'string') return h;
    if (h && typeof h === 'object' && 'hook' in h) return (h as { hook: string }).hook;
    return String(h);
  });

  const handleCopyBrief = () => {
    const prompt =
      angle.brief_prompt ||
      buildBriefPrompt(
        angle.client?.name || 'Client',
        angle.product?.name || 'Product',
        angle.title,
        angle.description,
        hooks,
        segmentTags,
        angle.awareness_stage,
        psychologyTags
      );

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Mark angle as briefed
    fetch(`/api/angles/${angle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief_copied: true }),
    }).then(() => onBriefCopied?.());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span
              className="rounded-md px-2.5 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: productColor }}
            >
              {angle.product?.short_code}
            </span>
            <span className="text-sm text-gray-500">
              {angle.product?.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">{angle.title}</h2>
          <p className="text-gray-600 leading-relaxed">{angle.description}</p>

          {/* Status & Awareness Stage */}
          <div className="flex items-center gap-3">
            {angle.awareness_stage && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: `${STAGE_COLORS[angle.awareness_stage]}15`,
                  color: STAGE_COLORS[angle.awareness_stage],
                }}
              >
                {angle.awareness_stage} aware
              </span>
            )}
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: `${STATUS_COLORS[angle.status]}15`,
                color: STATUS_COLORS[angle.status],
              }}
            >
              {angle.status}
            </span>
          </div>

          {/* Hooks */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Example Hooks
            </h4>
            <div className="space-y-2">
              {hooks.map((hook, i) => (
                <div
                  key={i}
                  className="rounded-lg px-4 py-3 text-sm italic leading-relaxed"
                  style={{
                    backgroundColor: `${productColor}08`,
                    borderLeft: `3px solid ${productColor}`,
                    color: '#374151',
                  }}
                >
                  &ldquo;{hook}&rdquo;
                </div>
              ))}
            </div>
          </div>

          {/* Segment Tags */}
          {segmentTags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Target Segments
              </h4>
              <div className="flex flex-wrap gap-2">
                {segmentTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Psychology Tags */}
          {psychologyTags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Psychology Principles
              </h4>
              <div className="flex flex-wrap gap-2">
                {psychologyTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Copy Brief Button */}
          <button
            onClick={handleCopyBrief}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg"
          >
            {copied ? '✓ Copied to Clipboard!' : 'Copy Brief Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}

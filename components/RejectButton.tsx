'use client';

import { useState, useRef, useEffect } from 'react';
import { Angle } from '@/lib/types';

interface RejectButtonProps {
  angle: Angle;
  onRejected: () => void;
}

export default function RejectButton({ angle, onRejected }: RejectButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showModal]);

  const handleRejectWithFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);

    try {
      // Save rejection feedback
      await fetch('/api/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: angle.client_id,
          product_id: angle.product_id,
          angle_title: angle.title,
          angle_description: angle.description,
          feedback: feedback.trim(),
          segment_tags: angle.segment_tags,
          psychology_tags: angle.psychology_tags,
          awareness_stage: angle.awareness_stage,
        }),
      });

      // Delete the angle
      await fetch(`/api/angles/${angle.id}`, { method: 'DELETE' });

      setShowModal(false);
      setFeedback('');
      onRejected();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectNoReason = async () => {
    setSubmitting(true);
    try {
      // Just delete — no training saved
      await fetch(`/api/angles/${angle.id}`, { method: 'DELETE' });
      setShowModal(false);
      onRejected();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
        title="Reject angle"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              setFeedback('');
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Angle</h3>
            <p className="text-sm text-gray-500 mb-4">
              Why doesn&apos;t this angle work? Your feedback will be used to improve future generations.
            </p>

            <textarea
              ref={textareaRef}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Hook is too generic, doesn't match brand voice, wrong awareness stage..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
              rows={4}
            />

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleRejectWithFeedback}
                disabled={!feedback.trim() || submitting}
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Rejecting...' : 'Reject & Save Feedback'}
              </button>
              <button
                onClick={handleRejectNoReason}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                No Exact Reason — Just Delete
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFeedback('');
                }}
                className="w-full rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

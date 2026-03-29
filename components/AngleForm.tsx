'use client';

import { Client, Product, Segment, PSYCHOLOGY_TAGS, AWARENESS_STAGES, STATUS_OPTIONS } from '@/lib/types';
import { useState, useEffect } from 'react';

interface AngleFormProps {
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
  defaultClientId?: string | null;
}

export default function AngleForm({
  clients,
  onClose,
  onCreated,
  defaultClientId,
}: AngleFormProps) {
  const [clientId, setClientId] = useState(defaultClientId || clients[0]?.id || '');
  const [productId, setProductId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hooks, setHooks] = useState(['', '', '']);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedPsychology, setSelectedPsychology] = useState<string[]>([]);
  const [awarenessStage, setAwarenessStage] = useState<string>('');
  const [status, setStatus] = useState('untested');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);

  const selectedClient = clients.find((c) => c.id === clientId);
  const products: Product[] = selectedClient?.products || [];

  useEffect(() => {
    if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  useEffect(() => {
    if (clientId) {
      fetch(`/api/segments?client_id=${clientId}`)
        .then((r) => r.json())
        .then(setSegments)
        .catch(() => setSegments([]));
    }
  }, [clientId]);

  const toggleSegment = (name: string) => {
    setSelectedSegments((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const togglePsychology = (tag: string) => {
    setSelectedPsychology((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          product_id: productId,
          title: title.trim(),
          description: description.trim(),
          hooks: hooks.filter((h) => h.trim()),
          segment_tags: selectedSegments,
          psychology_tags: selectedPsychology,
          awareness_stage: awarenessStage || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create angle');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create angle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Add Angle</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Client & Product */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProductId('');
                  setSelectedSegments([]);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The angle headline..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this angle is about..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
            />
          </div>

          {/* Hooks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hooks
            </label>
            <div className="space-y-2">
              {hooks.map((hook, i) => (
                <input
                  key={i}
                  type="text"
                  value={hook}
                  onChange={(e) => {
                    const newHooks = [...hooks];
                    newHooks[i] = e.target.value;
                    setHooks(newHooks);
                  }}
                  placeholder={`Hook ${i + 1}...`}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              ))}
            </div>
          </div>

          {/* Segment Tags */}
          {segments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => toggleSegment(seg.name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedSegments.includes(seg.name)
                        ? seg.type === 'motivator'
                          ? 'bg-purple-600 text-white'
                          : 'bg-blue-600 text-white'
                        : seg.type === 'motivator'
                          ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {seg.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Psychology Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Psychology Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {PSYCHOLOGY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => togglePsychology(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedPsychology.includes(tag)
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Awareness Stage & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Awareness Stage
              </label>
              <select
                value={awarenessStage}
                onChange={(e) => setAwarenessStage(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="">Select...</option>
                {AWARENESS_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Add Angle'}
          </button>
        </div>
      </div>
    </div>
  );
}

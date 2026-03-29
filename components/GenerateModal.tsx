'use client';

import { Client, Product } from '@/lib/types';
import { useState, useEffect } from 'react';

interface GenerateModalProps {
  clients: Client[];
  onClose: () => void;
  onGenerated: () => void;
  defaultClientId?: string | null;
}

export default function GenerateModal({
  clients,
  onClose,
  onGenerated,
  defaultClientId,
}: GenerateModalProps) {
  const [mode, setMode] = useState<'bulk' | 'single'>('single');
  const [clientId, setClientId] = useState(defaultClientId || clients[0]?.id || '');
  const [productId, setProductId] = useState('');
  const [count, setCount] = useState(10);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedClient = clients.find((c) => c.id === clientId);
  const products: Product[] = selectedClient?.products || [];

  useEffect(() => {
    if (mode === 'single' && products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [mode, products, productId]);

  useEffect(() => {
    setCount(mode === 'bulk' ? 5 : 10);
  }, [mode]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = { client_id: clientId, count };
      if (mode === 'single') {
        body.product_id = productId;
      }
      if (context.trim()) {
        body.context = context.trim();
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      onGenerated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
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
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            ✨ Generate Angles
          </h2>
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
          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === 'single'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Single Product
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === 'bulk'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Bulk Generate
              </button>
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setProductId('');
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

          {/* Product (single mode) */}
          {mode === 'single' && (
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
          )}

          {/* Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'bulk' ? 'Angles per product' : 'Number of angles'}
            </label>
            <input
              type="number"
              min={1}
              max={25}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context{' '}
              <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="Any specific focus areas, promotions, seasonal themes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating angles...
              </span>
            ) : (
              `✨ Generate ${mode === 'bulk' ? `${count} per product` : `${count} Angles`}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

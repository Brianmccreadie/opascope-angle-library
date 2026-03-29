'use client';

import { Client, Product } from '@/lib/types';
import { useState } from 'react';

interface GenerateModalProps {
  clients: Client[];
  onClose: () => void;
  onGenerated: () => void;
  defaultClientId?: string | null;
}

interface ClientConfig {
  clientId: string;
  enabled: boolean;
  anglesPerProduct: number;
  selectedProductIds: string[];
}

export default function GenerateModal({
  clients,
  onClose,
  onGenerated,
  defaultClientId,
}: GenerateModalProps) {
  // Initialize configs for all clients
  const [clientConfigs, setClientConfigs] = useState<ClientConfig[]>(() =>
    clients.map((c) => ({
      clientId: c.id,
      enabled: defaultClientId ? c.id === defaultClientId : false,
      anglesPerProduct: 5,
      selectedProductIds: (c.products || []).map((p) => p.id),
    }))
  );
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [error, setError] = useState('');

  const updateConfig = (clientId: string, updates: Partial<ClientConfig>) => {
    setClientConfigs((prev) =>
      prev.map((c) => (c.clientId === clientId ? { ...c, ...updates } : c))
    );
  };

  const toggleProduct = (clientId: string, productId: string) => {
    setClientConfigs((prev) =>
      prev.map((c) => {
        if (c.clientId !== clientId) return c;
        const selected = c.selectedProductIds.includes(productId)
          ? c.selectedProductIds.filter((id) => id !== productId)
          : [...c.selectedProductIds, productId];
        return { ...c, selectedProductIds: selected };
      })
    );
  };

  const selectAllProducts = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    updateConfig(clientId, {
      selectedProductIds: (client.products || []).map((p) => p.id),
    });
  };

  const deselectAllProducts = (clientId: string) => {
    updateConfig(clientId, { selectedProductIds: [] });
  };

  const enabledConfigs = clientConfigs.filter((c) => c.enabled && c.selectedProductIds.length > 0);

  const totalAngles = enabledConfigs.reduce((sum, c) => {
    return sum + c.anglesPerProduct * c.selectedProductIds.length;
  }, 0);

  const totalApiCalls = enabledConfigs.reduce((sum, c) => {
    return sum + c.selectedProductIds.length;
  }, 0);

  const handleGenerate = async () => {
    if (enabledConfigs.length === 0) {
      setError('Select at least one client with products');
      return;
    }

    setLoading(true);
    setError('');

    let completed = 0;
    const total = totalApiCalls;

    try {
      for (const config of enabledConfigs) {
        const client = clients.find((c) => c.id === config.clientId);
        if (!client) continue;

        // Generate per-product to get better quality (focused prompts)
        for (const productId of config.selectedProductIds) {
          const product = (client.products || []).find((p: Product) => p.id === productId);
          setProgress({
            current: completed + 1,
            total,
            label: `${client.name} → ${product?.name || 'Unknown'}`,
          });

          const body: Record<string, unknown> = {
            client_id: config.clientId,
            product_id: productId,
            count: config.anglesPerProduct,
          };
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
            throw new Error(`${client.name} / ${product?.name}: ${data.error || 'Failed'}`);
          }

          completed++;
        }
      }

      setProgress(null);
      onGenerated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">✨ Bulk Generate Angles</h2>
            <p className="text-sm text-gray-500 mt-0.5">Select clients, products, and how many angles per product</p>
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

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Client sections */}
          {clients.map((client) => {
            const config = clientConfigs.find((c) => c.clientId === client.id)!;
            const products: Product[] = client.products || [];

            return (
              <div
                key={client.id}
                className={`rounded-xl border-2 transition-all ${
                  config.enabled
                    ? 'border-purple-200 bg-purple-50/30'
                    : 'border-gray-100 bg-gray-50/30'
                }`}
              >
                {/* Client header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => updateConfig(client.id, { enabled: !config.enabled })}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        config.enabled
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {config.enabled && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: client.color }}
                    />
                    <span className="font-semibold text-gray-900">{client.name}</span>
                    <span className="text-xs text-gray-400">{products.length} products</span>
                  </div>
                  {config.enabled && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <label className="text-xs text-gray-500 whitespace-nowrap">per product:</label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={config.anglesPerProduct}
                        onChange={(e) =>
                          updateConfig(client.id, {
                            anglesPerProduct: Math.max(1, Math.min(25, parseInt(e.target.value) || 1)),
                          })
                        }
                        className="w-14 rounded-md border border-gray-200 px-2 py-1 text-sm text-center text-gray-900 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-100"
                      />
                    </div>
                  )}
                </div>

                {/* Product toggles (only when enabled) */}
                {config.enabled && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => selectAllProducts(client.id)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Select all
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => deselectAllProducts(client.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                      >
                        Deselect all
                      </button>
                      <span className="ml-auto text-xs text-gray-400">
                        {config.selectedProductIds.length} selected → {config.selectedProductIds.length * config.anglesPerProduct} angles
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {products.map((product) => {
                        const isSelected = config.selectedProductIds.includes(product.id);
                        return (
                          <button
                            key={product.id}
                            onClick={() => toggleProduct(client.id, product.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              isSelected
                                ? 'text-white shadow-sm'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            style={
                              isSelected
                                ? { backgroundColor: product.color }
                                : undefined
                            }
                          >
                            <span>{product.short_code}</span>
                            <span className={isSelected ? 'opacity-80' : ''}>{product.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Additional context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context <span className="text-gray-400">(optional — applies to all)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              placeholder="Seasonal themes, promotions, specific awareness stages to focus on, new product launches..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex-shrink-0">
          {/* Summary */}
          {enabledConfigs.length > 0 && (
            <div className="mb-3 rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong className="text-gray-900">{enabledConfigs.length}</strong> client{enabledConfigs.length !== 1 ? 's' : ''}
                </span>
                <span>
                  <strong className="text-gray-900">{totalApiCalls}</strong> product{totalApiCalls !== 1 ? 's' : ''}
                </span>
                <span>
                  <strong className="text-purple-600">{totalAngles}</strong> total angles
                </span>
                <span className="text-gray-400">
                  ~{totalApiCalls} API call{totalApiCalls !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {progress && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{progress.label}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || enabledConfigs.length === 0}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating {totalAngles} angles...
              </span>
            ) : enabledConfigs.length === 0 ? (
              'Select clients and products to generate'
            ) : (
              `✨ Generate ${totalAngles} Angles across ${enabledConfigs.length} Client${enabledConfigs.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

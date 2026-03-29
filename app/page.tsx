'use client';

import { useEffect, useState, useCallback } from 'react';
import { Client, Angle } from '@/lib/types';
import ClientSelector from '@/components/ClientSelector';
import ProductFilter from '@/components/ProductFilter';
import SearchBar from '@/components/SearchBar';
import AngleCard from '@/components/AngleCard';
import AngleDetailModal from '@/components/AngleDetailModal';
import GenerateModal from '@/components/GenerateModal';
import AngleForm from '@/components/AngleForm';

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [angles, setAngles] = useState<Angle[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allClientAngles, setAllClientAngles] = useState<Angle[]>([]);

  // Fetch clients on mount
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch angles when filters change
  const fetchAngles = useCallback(async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('client_id', selectedClientId);
      if (selectedProductId) params.set('product_id', selectedProductId);
      if (search) params.set('search', search);
      params.set('sort', sort);

      const res = await fetch(`/api/angles?${params}`);
      const data = await res.json();
      setAngles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch angles:', err);
      setAngles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, selectedProductId, search, sort]);

  useEffect(() => {
    fetchAngles();
  }, [fetchAngles]);

  // Fetch all angles for this client (for product counts)
  const fetchAllClientAngles = useCallback(async () => {
    if (!selectedClientId) return;
    try {
      const res = await fetch(`/api/angles?client_id=${selectedClientId}`);
      const data = await res.json();
      setAllClientAngles(Array.isArray(data) ? data : []);
    } catch {
      setAllClientAngles([]);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchAllClientAngles();
  }, [fetchAllClientAngles]);

  // Re-fetch all client angles when filtered angles change (new angle added/generated)
  useEffect(() => {
    fetchAllClientAngles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angles.length]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const products = selectedClient?.products || [];

  const angleCounts: Record<string, number> = {};
  allClientAngles.forEach((a) => {
    angleCounts[a.product_id] = (angleCounts[a.product_id] || 0) + 1;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              Angle Library
              <span className="ml-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-500">
                {allClientAngles.length}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              + Add Angle
            </button>
            <button
              onClick={() => setShowGenerate(true)}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-md"
            >
              ✨ Generate Angles
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
        {/* Client Selector */}
        <ClientSelector
          clients={clients}
          selectedClientId={selectedClientId}
          onSelect={(id) => {
            setSelectedClientId(id);
            setSelectedProductId(null);
            setSelectedIds(new Set());
          }}
        />

        {/* Product Filter */}
        {products.length > 0 && (
          <ProductFilter
            products={products}
            selectedProductId={selectedProductId}
            onSelect={setSelectedProductId}
            angleCounts={angleCounts}
            totalCount={allClientAngles.length}
          />
        )}

        {/* Search & Sort */}
        <SearchBar onSearch={handleSearch} sort={sort} onSortChange={setSort} />

        {/* Angle Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              Loading angles...
            </div>
          </div>
        ) : angles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl">📐</div>
            <h3 className="text-lg font-semibold text-gray-700">No angles yet</h3>
            <p className="mt-1 text-sm text-gray-400">
              Add angles manually or use AI to generate them.
            </p>
            <button
              onClick={() => setShowGenerate(true)}
              className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
            >
              ✨ Generate Angles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {angles.map((angle) => (
              <AngleCard
                key={angle.id}
                angle={angle}
                onClick={() => setSelectedAngle(angle)}
                selected={selectedIds.has(angle.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedAngle && (
        <AngleDetailModal
          angle={selectedAngle}
          onClose={() => setSelectedAngle(null)}
        />
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateModal
          clients={clients}
          onClose={() => setShowGenerate(false)}
          onGenerated={fetchAngles}
          defaultClientId={selectedClientId}
        />
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <AngleForm
          clients={clients}
          onClose={() => setShowAddForm(false)}
          onCreated={fetchAngles}
          defaultClientId={selectedClientId}
        />
      )}
    </div>
  );
}

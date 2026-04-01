'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Client, Angle, AWARENESS_STAGES } from '@/lib/types';
import AngleCard from '@/components/AngleCard';
import AngleDetailModal from '@/components/AngleDetailModal';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

type GroupMode = 'client' | 'product' | 'awareness' | 'flat';

export default function AllBrandsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allAngles, setAllAngles] = useState<Angle[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>('client');

  // Filters
  const [filterClientIds, setFilterClientIds] = useState<Set<string>>(new Set());
  const [filterAwareness, setFilterAwareness] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Fetch clients
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => setClients(data))
      .catch(console.error);
  }, []);

  // Fetch all angles
  const fetchAngles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('sort', sort);

      const res = await fetch(`/api/angles?${params}`);
      const data = await res.json();
      setAllAngles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch angles:', err);
      setAllAngles([]);
    } finally {
      setLoading(false);
    }
  }, [search, sort]);

  useEffect(() => {
    fetchAngles();
  }, [fetchAngles]);

  // Apply local filters
  const filteredAngles = useMemo(() => {
    return allAngles.filter((a) => {
      if (filterClientIds.size > 0 && !filterClientIds.has(a.client_id)) return false;
      if (filterAwareness && a.awareness_stage !== filterAwareness) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      return true;
    });
  }, [allAngles, filterClientIds, filterAwareness, filterStatus]);

  // Group angles
  const grouped = useMemo(() => {
    if (groupMode === 'flat') return { 'All Angles': filteredAngles };

    const groups: Record<string, Angle[]> = {};

    filteredAngles.forEach((angle) => {
      let key: string;
      if (groupMode === 'client') {
        key = angle.client?.name || 'Unknown Client';
      } else if (groupMode === 'product') {
        const clientName = angle.client?.name || 'Unknown';
        const productName = angle.product?.name || 'Unknown Product';
        key = `${clientName} → ${productName}`;
      } else {
        key = angle.awareness_stage
          ? angle.awareness_stage.charAt(0).toUpperCase() + angle.awareness_stage.slice(1)
          : 'Untagged';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(angle);
    });

    return groups;
  }, [filteredAngles, groupMode]);

  // Client color map
  const clientColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.name] = c.color;
      map[c.id] = c.color;
    });
    return map;
  }, [clients]);

  // Stats
  const stats = useMemo(() => {
    const byClient: Record<string, number> = {};
    const byStage: Record<string, number> = {};

    filteredAngles.forEach((a) => {
      const cName = a.client?.name || 'Unknown';
      byClient[cName] = (byClient[cName] || 0) + 1;
      const stage = a.awareness_stage || 'untagged';
      byStage[stage] = (byStage[stage] || 0) + 1;
    });

    return { byClient, byStage };
  }, [filteredAngles]);

  const toggleClientFilter = (clientId: string) => {
    setFilterClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

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

  const groupKeys = Object.keys(grouped);

  // Sort group keys logically
  const sortedGroupKeys = useMemo(() => {
    if (groupMode === 'awareness') {
      const order = ['Symptom', 'Problem', 'Solution', 'Product', 'Offer', 'Untagged'];
      return groupKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    return groupKeys.sort();
  }, [groupKeys, groupMode]);

  const getGroupColor = (key: string): string => {
    if (groupMode === 'client') return clientColorMap[key] || '#6b7280';
    if (groupMode === 'product') {
      const clientName = key.split(' → ')[0];
      return clientColorMap[clientName] || '#6b7280';
    }
    const stageColors: Record<string, string> = {
      Symptom: '#f59e0b',
      Problem: '#ef4444',
      Solution: '#10b981',
      Product: '#3b82f6',
      Offer: '#8b5cf6',
      Untagged: '#9ca3af',
    };
    return stageColors[key] || '#6b7280';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              All Brands
              <span className="ml-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-500">
                {filteredAngles.length}
                {filteredAngles.length !== allAngles.length && (
                  <span className="text-gray-400"> / {allAngles.length}</span>
                )}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Group mode toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
              {[
                { value: 'client' as GroupMode, label: 'By Brand' },
                { value: 'product' as GroupMode, label: 'By Product' },
                { value: 'awareness' as GroupMode, label: 'By Stage' },
                { value: 'flat' as GroupMode, label: 'Flat' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setGroupMode(value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    groupMode === value
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-4">
        {/* Client filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">
            Filter:
          </span>
          {clients.map((client) => {
            const isActive = filterClientIds.has(client.id);
            const count = stats.byClient[client.name] || 0;
            return (
              <button
                key={client.id}
                onClick={() => toggleClientFilter(client.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive ? client.color : `${client.color}18`,
                  color: isActive ? 'white' : client.color,
                }}
              >
                {client.name}
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.25)'
                      : `${client.color}25`,
                    color: isActive ? 'white' : client.color,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Awareness stage filter */}
          <div className="ml-2 border-l border-gray-200 pl-2 flex items-center gap-1.5">
            {AWARENESS_STAGES.map((stage) => {
              const isActive = filterAwareness === stage;
              return (
                <button
                  key={stage}
                  onClick={() =>
                    setFilterAwareness(isActive ? null : stage)
                  }
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {stage}
                </button>
              );
            })}
          </div>

          {/* Clear filters */}
          {(filterClientIds.size > 0 || filterAwareness || filterStatus) && (
            <button
              onClick={() => {
                setFilterClientIds(new Set());
                setFilterAwareness(null);
                setFilterStatus(null);
              }}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search & Sort */}
        <SearchBar onSearch={handleSearch} sort={sort} onSortChange={setSort} />

        {/* Content */}
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
              Loading all angles...
            </div>
          </div>
        ) : filteredAngles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700">No angles match your filters</h3>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting your brand or stage filters.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroupKeys.map((groupKey) => {
              const groupAngles = grouped[groupKey];
              const groupColor = getGroupColor(groupKey);

              return (
                <section key={groupKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="h-1 w-8 rounded-full"
                      style={{ backgroundColor: groupColor }}
                    />
                    <h2 className="text-lg font-bold text-gray-800">
                      {groupKey}
                    </h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      {groupAngles.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupAngles.map((angle) => (
                      <div key={angle.id} className="relative">
                        {/* Client color indicator for flat/awareness views */}
                        {groupMode !== 'client' && angle.client && (
                          <div
                            className="absolute -left-1.5 top-4 bottom-4 w-1 rounded-full"
                            style={{
                              backgroundColor:
                                clientColorMap[angle.client.name] || '#6b7280',
                            }}
                          />
                        )}
                        <AngleCard
                          angle={angle}
                          onClick={() => setSelectedAngle(angle)}
                          selected={selectedIds.has(angle.id)}
                          onToggleSelect={toggleSelect}
                          onRejected={fetchAngles}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedAngle && (
        <AngleDetailModal
          angle={selectedAngle}
          onClose={() => setSelectedAngle(null)}
          onBriefCopied={fetchAngles}
        />
      )}
    </div>
  );
}

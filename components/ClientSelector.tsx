'use client';

import { Client } from '@/lib/types';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelect: (clientId: string) => void;
}

export default function ClientSelector({
  clients,
  selectedClientId,
  onSelect,
}: ClientSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {clients.map((client) => (
        <button
          key={client.id}
          onClick={() => onSelect(client.id)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            selectedClientId === client.id
              ? 'text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
          style={
            selectedClientId === client.id
              ? { backgroundColor: client.color }
              : undefined
          }
        >
          {client.name}
        </button>
      ))}
    </div>
  );
}

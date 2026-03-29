'use client';

import { Product } from '@/lib/types';

interface ProductFilterProps {
  products: Product[];
  selectedProductId: string | null;
  onSelect: (productId: string | null) => void;
  angleCounts: Record<string, number>;
  totalCount: number;
}

export default function ProductFilter({
  products,
  selectedProductId,
  onSelect,
  angleCounts,
  totalCount,
}: ProductFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
          selectedProductId === null
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
        <span
          className={`rounded-full px-1.5 py-0.5 text-xs ${
            selectedProductId === null
              ? 'bg-white/20 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {totalCount}
        </span>
      </button>
      {products.map((product) => {
        const count = angleCounts[product.id] || 0;
        const isSelected = selectedProductId === product.id;
        return (
          <button
            key={product.id}
            onClick={() => onSelect(product.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              isSelected
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:opacity-80'
            }`}
            style={{
              backgroundColor: isSelected ? product.color : `${product.color}18`,
              color: isSelected ? 'white' : product.color,
            }}
          >
            {product.name}
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${product.color}25`,
                color: isSelected ? 'white' : product.color,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

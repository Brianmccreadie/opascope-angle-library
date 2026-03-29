import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch products for each client
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('name');

  // Fetch segment counts per client
  const { data: segments } = await supabaseAdmin
    .from('segments')
    .select('*')
    .order('name');

  const clientsWithRelations = clients.map((client) => ({
    ...client,
    products: (products || []).filter((p) => p.client_id === client.id),
    segments: (segments || []).filter((s) => s.client_id === client.id),
  }));

  return NextResponse.json(clientsWithRelations);
}

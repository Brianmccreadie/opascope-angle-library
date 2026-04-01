import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const productId = searchParams.get('product_id');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'newest';

  let query = supabaseAdmin
    .from('angles')
    .select('*, product:products(*), client:clients(*)');

  // When no client_id is provided, return all angles (for All Brands view)
  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'title') {
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const angles = Array.isArray(body) ? body : [body];

  const { data, error } = await supabaseAdmin
    .from('angles')
    .insert(angles)
    .select('*, product:products(*), client:clients(*)');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase-server';
import { buildGenerationSystemPrompt, buildBriefPrompt } from '@/lib/prompts';
import { loadAllTrainingForClient } from '@/lib/training-loader';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { client_id, product_id, count = 10, context } = await request.json();

    // Fetch client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch segments
    const { data: segments } = await supabaseAdmin
      .from('segments')
      .select('*')
      .eq('client_id', client_id);

    // Fetch products
    let productsQuery = supabaseAdmin
      .from('products')
      .select('*')
      .eq('client_id', client_id);

    if (product_id) {
      productsQuery = productsQuery.eq('id', product_id);
    }

    const { data: products } = await productsQuery;

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }

    // Load real training data from files
    const trainingData = loadAllTrainingForClient(client.slug);

    const systemPrompt = buildGenerationSystemPrompt(
      client,
      segments || [],
      products
    ) + '\n\n' + trainingData;

    let userPrompt: string;
    if (product_id) {
      const product = products[0];
      userPrompt = `Generate ${count} unique ad angles for ${product.name} (${product.short_code}).${context ? `\n\nAdditional context: ${context}` : ''}

Each angle should target a different combination of awareness stage, segment, and psychology principle. Vary the hook frameworks used. Return a JSON array.`;
    } else {
      const perProduct = count;
      userPrompt = `Generate ${perProduct} unique ad angles for EACH of these products: ${products.map((p) => `${p.name} (${p.short_code})`).join(', ')}.${context ? `\n\nAdditional context: ${context}` : ''}

For each product, vary the awareness stages, segments, and psychology principles. Use different hook frameworks. Return a single flat JSON array containing all angles. Include a "product_short_code" field in each object so I can match them to products.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    let generatedAngles;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedAngles = JSON.parse(jsonMatch[0]);
      } else {
        generatedAngles = JSON.parse(responseText);
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    // Map generated angles to DB format and insert
    const productMap = new Map(
      products.map((p) => [p.short_code, p])
    );

    const anglesToInsert = generatedAngles.map(
      (angle: {
        title: string;
        description: string;
        hooks: string[];
        segment_tags: string[];
        psychology_tags: string[];
        awareness_stage: string;
        product_short_code?: string;
      }) => {
        let matchedProduct = products[0];
        if (angle.product_short_code && productMap.has(angle.product_short_code)) {
          matchedProduct = productMap.get(angle.product_short_code)!;
        }

        const briefPrompt = buildBriefPrompt(
          client.name,
          matchedProduct.name,
          angle.title,
          angle.description,
          angle.hooks,
          angle.segment_tags,
          angle.awareness_stage,
          angle.psychology_tags
        );

        return {
          client_id,
          product_id: matchedProduct.id,
          title: angle.title,
          description: angle.description,
          hooks: angle.hooks,
          segment_tags: angle.segment_tags,
          psychology_tags: angle.psychology_tags,
          awareness_stage: angle.awareness_stage,
          status: 'untested',
          brief_prompt: briefPrompt,
        };
      }
    );

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('angles')
      .insert(anglesToInsert)
      .select('*, product:products(*), client:clients(*)');

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

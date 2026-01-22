export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ warning: 'Database not configured' }), { status: 200 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    let query = 'SELECT * FROM conversion_stats';
    const params = [];

    if (type) {
        query += ' WHERE unit_type = ?';
        params.push(type);
    }

    query += ' ORDER BY last_updated DESC LIMIT 10';

    const results = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results.results), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error('Database error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500 });
  }
}

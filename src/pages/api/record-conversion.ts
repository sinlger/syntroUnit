export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { source_unit, target_unit, source_value, target_value, unit_type } = data;

    if (!source_unit || !target_unit || !source_value) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const db = locals.runtime?.env?.DB;

    if (!db) {
      // If DB is not available (e.g. during build or local dev without proper setup), return silently or error
      // returning 200 to avoid breaking frontend if DB is missing in dev
      return new Response(JSON.stringify({ warning: 'Database not configured' }), { status: 200 });
    }

    const timestamp = Date.now();
    await db.prepare(`
      INSERT INTO conversion_stats (source_unit, target_unit, source_value, target_value, unit_type, count, last_updated)
      VALUES (?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(source_unit, target_unit, source_value)
      DO UPDATE SET count = count + 1, last_updated = ?, target_value = excluded.target_value, unit_type = excluded.unit_type
    `).bind(source_unit, target_unit, source_value, target_value || null, unit_type || null, timestamp, timestamp).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error('Database error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500 });
  }
}

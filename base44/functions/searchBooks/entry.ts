import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = (body.query || '').trim();
    if (!query) return Response.json({ books: [] });

    // Open Library — free, no API key required.
    const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(query) + '&limit=24&fields=title,author_name,isbn,cover_i,first_publish_year,subject,key';
    const resp = await fetch(url);
    if (!resp.ok) return Response.json({ error: 'Book search failed' }, { status: 502 });
    const data = await resp.json();

    const books = (data.docs || []).map((d) => ({
      external_id: d.key,
      title: d.title || 'Untitled',
      author: (d.author_name || []).join(', '),
      cover_url: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-M.jpg' : '',
      description: '',
      isbn: (d.isbn || [])[0] || '',
      publication_date: d.first_publish_year ? String(d.first_publish_year) : '',
      genres: (d.subject || []).slice(0, 6),
      page_count: 0,
      source: 'openlibrary'
    }));

    return Response.json({ books });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { sessionId, action } = body;
    if (!sessionId || !['join', 'leave'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Read the session with the service role so we can modify membership
    // regardless of who created the reading circle.
    const session = await base44.asServiceRole.entities.ReadingSession.get(sessionId);
    if (!session) return Response.json({ error: 'Not found' }, { status: 404 });

    let members = Array.isArray(session.members) ? [...session.members] : [];
    let member_profiles = Array.isArray(session.member_profiles) ? [...session.member_profiles] : [];

    if (action === 'join') {
      if (!members.includes(user.id)) {
        members.push(user.id);
        member_profiles.push({
          id: user.id,
          name: user.display_name || user.username,
          username: user.username,
          avatar: user.profile_picture
        });
      }
      await base44.asServiceRole.entities.ReadingSession.update(sessionId, {
        members, member_count: members.length, member_profiles
      });
      // Add to the user's own reading shelf (user-scoped → owner is the user)
      const existing = await base44.entities.UserBook.filter({ session_id: sessionId }, null, 1);
      if (!existing || existing.length === 0) {
        await base44.entities.UserBook.create({
          book_id: session.book_id, book_title: session.book_title, book_author: session.book_author,
          book_cover: session.book_cover, session_id: sessionId, status: 'reading',
          started_date: session.start_date || new Date().toISOString().slice(0, 10)
        });
      }
      // Drop a personal copy of the uploaded book file into the user's library
      if (session.book_file_url) {
        const existingEpub = await base44.entities.UserEpub.filter({ session_id: sessionId }, null, 1);
        if (!existingEpub || existingEpub.length === 0) {
          await base44.entities.UserEpub.create({
            title: session.book_title, author: session.book_author, cover_url: session.book_cover,
            file_url: session.book_file_url, file_type: session.book_file_type || 'epub',
            session_id: sessionId, progress: 0
          });
        }
      }
      // Notify the creator
      if (session.created_by_id && session.created_by_id !== user.id) {
        try {
          await base44.entities.Notification.create({
            user_id: session.created_by_id, type: 'session_join',
            text: (user.display_name || user.username) + ' joined your reading of ' + session.book_title,
            link: '/session/' + sessionId, actor_id: user.id, is_read: false
          });
        } catch (e) { /* best-effort */ }
      }
      return Response.json({ ok: true, joined: true, member_count: members.length });
    }

    // leave
    members = members.filter((m) => m !== user.id);
    member_profiles = member_profiles.filter((m) => m.id !== user.id);
    await base44.asServiceRole.entities.ReadingSession.update(sessionId, {
      members, member_count: members.length, member_profiles
    });
    const ub = await base44.entities.UserBook.filter({ session_id: sessionId }, null, 1);
    if (ub && ub.length > 0) {
      await base44.entities.UserBook.update(ub[0].id, { status: 'abandoned' });
    }
    return Response.json({ ok: true, joined: false, member_count: members.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
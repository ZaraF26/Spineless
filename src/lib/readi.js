// Shared helpers and constants for Readi

export const GENRES = [
  "Fantasy", "Romance", "Mystery", "Thriller", "Horror", "Literary Fiction",
  "Historical Fiction", "Science Fiction", "Young Adult", "Contemporary",
  "Non-fiction", "Biography", "Self-help", "Poetry", "Classics", "Other"
];

export const PREFERENCES = [
  "I read every day", "I read when I have time", "I'm trying to read more",
  "I'm a slow reader", "I'm a fast reader", "I love rereading books",
  "I mostly listen to audiobooks", "I love physical books", "I mostly read digitally"
];

export const GOALS = [
  "Find people to read with", "Discover new books", "Stay accountable",
  "Talk about books", "Make new friends", "Track my reading", "Get back into reading"
];

export const REVIEW_TAGS = [
  "Loved it", "Couldn't put it down", "Made me cry", "Slow start", "Would reread", "Recommend"
];

export const REPORT_REASONS = [
  "Spoilers outside the appropriate chapter",
  "Harassment",
  "Hate speech",
  "Threats",
  "Sexual harassment",
  "Spam",
  "Other inappropriate content"
];

const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "dick", "bastard", "slut", "whore"];
export function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(lower));
}

export function maskProfanity(text) {
  if (!text) return text;
  let out = text;
  BAD_WORDS.forEach((w) => {
    out = out.replace(new RegExp(`\\b${w}\\b`, "gi"), (m) => m[0] + "*".repeat(m.length - 1));
  });
  return out;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

export function relativeDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.round((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return formatDate(dateStr);
}

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const secs = Math.round((Date.now() - d) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// Create a notification for a user (best-effort, never blocks)
export async function notify(base44, userId, type, text, link, actorId) {
  if (!userId) return;
  try {
    await base44.entities.Notification.create({
      user_id: userId, type, text, link, actor_id: actorId || null, is_read: false
    });
  } catch { /* best-effort */ }
}

export function coverColor(seed) {
  const palette = ["#C66B4A", "#B5825A", "#8A9A7B", "#C99A8A", "#7A6A5A", "#A87C5A", "#6E8B7B"];
  let h = 0;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
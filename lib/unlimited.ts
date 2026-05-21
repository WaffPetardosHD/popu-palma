/**
 * Returns true if the given username has unlimited daily votes.
 * Add usernames (comma-separated) to the UNLIMITED_VOTE_USERS env var.
 * e.g. UNLIMITED_VOTE_USERS=waffo,sergi
 */
export function hasUnlimitedVotes(username: string): boolean {
  const list = (process.env.UNLIMITED_VOTE_USERS || "")
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(username.toLowerCase());
}

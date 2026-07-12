// The admin (owner) account has full read/write. Any other signed-in account
// is a read-only viewer. Admin is identified by email, configured server-side
// via the ADMIN_EMAIL environment variable. Keep this value in sync with the
// email set inside the is_admin() SQL function in supabase-schema.sql.
export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  return !!admin && !!email && email.toLowerCase().trim() === admin;
}

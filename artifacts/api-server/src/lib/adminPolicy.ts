export const OWNER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

export function isOwnerAdmin(user: { email?: string | null; isAdmin?: boolean | null }): boolean {
  return user.isAdmin === true
    && user.email?.trim().toLowerCase() === OWNER_ADMIN_EMAIL;
}
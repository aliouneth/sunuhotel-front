import type { User } from "@/types/dto";

/**
 * Whether the user may access something guarded by `permission`. When the
 * permission list is unknown (e.g. an older session) we optimistically allow,
 * so the UI never hides more than the backend would reject.
 */
export function can(user: User | null | undefined, permission?: string): boolean {
  if (!permission) return true;
  if (!user?.permissions) return true;
  return user.permissions.includes(permission);
}

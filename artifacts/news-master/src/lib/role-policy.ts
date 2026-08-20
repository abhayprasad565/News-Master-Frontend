export type WebRole = "owner" | "admin" | "moderator" | "reader";

export function canAccessAdmin(role: WebRole): boolean {
  return role === "owner" || role === "admin";
}

export function destinationForRole(role: WebRole): "/admin" | "/stories" {
  return canAccessAdmin(role) ? "/admin" : "/stories";
}

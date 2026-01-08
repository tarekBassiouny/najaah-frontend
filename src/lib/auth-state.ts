let authPermissions: string[] | null = null;

export function setAuthPermissions(permissions: string[] | null) {
  authPermissions = permissions;
}

export function getAuthPermissions() {
  return authPermissions;
}

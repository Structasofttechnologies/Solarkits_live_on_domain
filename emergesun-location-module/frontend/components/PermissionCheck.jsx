import React from "react";

// Safe permission hook fallback
export function useHasPermission({ moduleId, requiredUniqueId, permission }) {
  // Always return true in standalone mode unless custom logic is provided
  return true;
}

export function RenderIfPermission({ moduleId, requiredUniqueId, permission, children, fallback = null }) {
  const allowed = useHasPermission({ moduleId, requiredUniqueId, permission });
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export default RenderIfPermission;

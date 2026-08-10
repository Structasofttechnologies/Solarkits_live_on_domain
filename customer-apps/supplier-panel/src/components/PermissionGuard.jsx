import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Loader from "./Loader";

export function PermissionGuard({ requiredUniqueId, children }) {
  return children;
}

// Context
export {
  PortalAuthProvider,
  usePortalAuth,
} from "./context/portal-auth-context";

// Hooks
export { usePortalMe } from "./hooks/use-portal-me";
export { useStudentSendOtp } from "./hooks/use-student-send-otp";
export {
  useStudentVerify,
  getStoredDeviceUuid,
} from "./hooks/use-student-verify";
export { useParentSendOtp } from "./hooks/use-parent-send-otp";
export { useParentVerify } from "./hooks/use-parent-verify";
export { useParentRegister } from "./hooks/use-parent-register";
export { usePortalLogout } from "./hooks/use-portal-logout";

// Components
export { PortalRouteGuard } from "./components/PortalRouteGuard";
export { RoleSwitcher } from "./components/RoleSwitcher";
export { PortalHeader } from "./components/PortalHeader";
export { PortalAuthShell } from "./components/PortalAuthShell";
export { OtpLoginForm } from "./components/OtpLoginForm";

// Types
export type {
  PortalUser,
  PortalRole,
  StudentProfile,
  ParentProfile,
  LinkedStudent,
  PortalAuthErrorCode,
} from "./types/portal-auth";

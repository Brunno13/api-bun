import { AppError } from "../../core/errors/appError";
import { ErrorCode, UserRole } from "../../core/messages/messages";

type RoleAwareUser = {
  role?: string | null;
};

export const requireRoles = (...allowedRoles: UserRole[]) => {
  const allowedRoleValues: readonly string[] = allowedRoles;

  return ({ user }: { user?: RoleAwareUser | null }) => {
    const role = user?.role;

    if (!role || !allowedRoleValues.includes(role)) {
      throw new AppError(ErrorCode.FORBIDDEN);
    }
  };
};
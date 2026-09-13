import { AppError } from "../../core/errors/appError";
import { ErrorCode, UserRole } from "../../core/messages/messages";

type RoleAwareUser = {
  role?: string | null;
};

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return ({ user }: { user?: RoleAwareUser | null }) => {
    const role = user?.role;

    if (
      !role ||
      !allowedRoles.some((allowedRole) => allowedRole === role)
    ) {
      throw new AppError(ErrorCode.FORBIDDEN);
    }
  };
};
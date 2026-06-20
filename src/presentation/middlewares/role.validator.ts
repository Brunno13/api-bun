import { AppError } from "../../core/errors/appError";
import { ErrorCode, UserRole } from "../../core/messages/messages";

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return ({ user }: { user: any }) => {
    if (!user || !user.role || !allowedRoles.includes(user.role as UserRole)) {
      throw new AppError(ErrorCode.FORBIDDEN);
    }
  };
};
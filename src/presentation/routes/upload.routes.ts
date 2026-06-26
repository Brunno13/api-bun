import { Elysia, t } from "elysia";
import { AwilixContainer } from "awilix";
import type { StorageService } from "../../core/domain/storageService";
import { auth } from "../../infrastructure/auth/auth";
import { AppError } from "../../core/errors/appError";
import { MESSAGES, ErrorCode, UserRole } from "../../core/messages/messages";
import { requireRoles } from "../middlewares/role.validator";

// 🔥 Definimos os formatos permitidos aqui para garantir consistência
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const uploadRoutes = (di: AwilixContainer) => {
  const storageService = di.resolve<StorageService>("storageService");

  return new Elysia({ prefix: "/api" })
    .derive(async ({ request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        throw new AppError(ErrorCode.UNAUTHORIZED);
      }

      return { user: session.user };
    })
    
    .post(
      "/avatar",
      async ({ body: { avatar } }) => {
        
        if (!ALLOWED_IMAGE_TYPES.includes(avatar.type as any)) {
          throw new AppError(ErrorCode.INVALID_DATA);
        }

        const publicUrl = await storageService.upload(avatar);
        
        return { 
          success: true,
          message: MESSAGES.SUCCESS.AVATAR_UPLOADED,
          url: publicUrl 
        };
      },
      {
        beforeHandle: requireRoles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER),
        body: t.Object({
          avatar: t.File({
            maxSize: "5m", 
          }),
        }),
        detail: {
          tags: [MESSAGES.DOCS.TAGS.UPLOAD],
          summary: MESSAGES.DOCS.UPLOAD.AVATAR,
        },
      }
    );
};
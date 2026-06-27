import { Elysia, t } from "elysia";
import { AwilixContainer } from "awilix";
import type { StorageService } from "../../core/domain/storageService";
import { auth } from "../../infrastructure/auth/auth";
import { AppError } from "../../core/errors/appError";
import { MESSAGES, ErrorCode, UserRole } from "../../core/messages/messages";
import { requireRoles } from "../middlewares/role.validator";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const uploadRoutes = (di: AwilixContainer) => {
  const storageService = di.resolve<StorageService>("storageService");

  return new Elysia({ prefix: "/api" })
    .get(
      "/avatar/:filename",
      async ({ params: { filename }, set }) => {
        const fileData = await storageService.getFile(filename);
        
        set.headers = {
          "Content-Type": fileData.contentType,
          "Cache-Control": "public, max-age=31536000",
        };
        
        return fileData.buffer;
      },
      {
        detail: {
          tags: [MESSAGES.DOCS.TAGS.UPLOAD],
          summary: "Exibe uma imagem de avatar",
        },
      }
    )
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
      async ({ body: { avatarBase64, fileName, mimeType } }) => {
        
        if (!ALLOWED_IMAGE_TYPES.includes(mimeType as any)) {
          throw new AppError(ErrorCode.INVALID_DATA);
        }

        const buffer = Buffer.from(avatarBase64, "base64");
        const file = new File([buffer], fileName, { type: mimeType });

        const publicUrl = await storageService.upload(file);
        
        return { 
          success: true,
          message: MESSAGES.SUCCESS.AVATAR_UPLOADED,
          url: publicUrl 
        };
      },
      {
        beforeHandle: requireRoles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER),
        body: t.Object({
          avatarBase64: t.String(),
          fileName: t.String(),
          mimeType: t.String(),
        }),
        detail: {
          tags: [MESSAGES.DOCS.TAGS.UPLOAD],
          summary: MESSAGES.DOCS.UPLOAD.AVATAR,
        },
      }
    );
};
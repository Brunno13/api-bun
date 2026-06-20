import { app } from "./presentation/routes";

app.listen(3000);

console.log(
  `🦊 Elysia está rodando em http://${app.server?.hostname}:${app.server?.port}`,
);

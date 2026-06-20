import { setupContainer } from "./container";
import { createApp } from "./presentation/routes";

const container = setupContainer();

const app = createApp(container);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🦊 Elysia está rodando em http://${app.server?.hostname}:${app.server?.port}`,
  );
});

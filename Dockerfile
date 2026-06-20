FROM oven/bun:alpine
WORKDIR /app
# Cria um arquivo package.json básico diretamente no build
RUN echo '{"type":"module"}' > package.json
COPY server.ts .
EXPOSE 3000
# Usamos ENTRYPOINT para blindar o comando e impedir que o Docker o ignore
ENTRYPOINT ["bun", "run", "server.ts"]
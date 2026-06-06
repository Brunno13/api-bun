FROM oven/bun:alpine
WORKDIR /app
# Cria um arquivo package.json básico diretamente no build
RUN echo '{"type":"module"}' > package.json
COPY server.ts .
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
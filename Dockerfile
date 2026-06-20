# Usa a imagem oficial e mais leve do Bun
FROM oven/bun:alpine

WORKDIR /app

# Copia os arquivos de dependência primeiro (aproveita o cache do Docker)
COPY package.json bun.lockb* ./

# Instala apenas dependências de produção
RUN bun install --production

# Copia o restante do código fonte
COPY src ./src

# Configura as variáveis de ambiente
ENV NODE_ENV=production

# O Elysia expõe a porta 3000 por padrão
EXPOSE 3000

# Inicia o servidor
CMD ["bun", "run", "src/index.ts"]

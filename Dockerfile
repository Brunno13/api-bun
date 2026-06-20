FROM oven/bun:alpine

WORKDIR /app

# Copia os arquivos de dependência
COPY package.json bun.lock* ./

# Removemos a flag --production. Precisamos instalar tudo para que o 'drizzle-kit'
# esteja disponível dentro do container para criar as tabelas.
RUN bun install

# Copia o código-fonte e o arquivo de configuração do banco
COPY src ./src
COPY drizzle.config.ts ./

ENV NODE_ENV=production

EXPOSE 3000

# O Truque de Mestre: Ao ligar o container, ele primeiro empurra o schema
# para o banco de dados e, se der sucesso (&&), ele inicia o servidor Elysia.
CMD ["sh", "-c", "bunx drizzle-kit push && bun run src/index.ts"]

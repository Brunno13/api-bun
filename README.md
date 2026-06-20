# API Bun - Clean Architecture Edition

Este projeto é uma API desenvolvida com o runtime **Bun** e o framework **Elysia**, estruturada sob os princípios da **Clean Architecture (Arquitetura Limpa)**. 

A arquitetura foi desenhada para garantir que a lógica de negócio seja independente de ferramentas externas, facilitado manutenções, testes e substituições tecnológicas sem impactar o núcleo do sistema.

## 🏗 Arquitetura do Projeto

O projeto é dividido em camadas concêntricas, onde as dependências apontam sempre para dentro (em direção ao centro/core).

### 1. Camada de Core (`src/core`)
É o "coração" da aplicação. Esta camada não conhece nada sobre banco de dados, protocolos de rede ou frameworks web. Ela contém apenas a lógica de negócio pura.

- **Domain (`src/core/domain`):** Define os objetos de domínio e as interfaces (contratos) que o sistema deve seguir. Por exemplo, define o que é um "Usuário" e quais métodos um repositório de usuários deve ter, sem implementar nada técnico.
- **Use Cases (`src/core/usecases`):** Contêm a lógica de execução das ações do usuário (ex: cadastrar_usuario, buscar_perfil). Eles coordenam o fluxo de dados entre os objetos de domínio e as abstrações de infraestrutura.

### 2. Camada de Infraestrutura (`src/infrastructure`)
Esta camada lida com detalhes técnicos e ferramentas externas. Ela implementa as interfaces definidas na camada de Core.

- **Repositories (`src/infrastructure/repositories`):** Implementam o acesso a dados (neste caso, utilizando **Drizzle ORM**). Se no futuro decidirmos trocar o banco de dados ou o ORM, apenas esta pasta será alterada.
- **Auth (`src/infrastructure/auth.ts`):** Contém as integrações com sistemas de autenticação (como **Better Auth**), tratando a lógica complexa de sessões e tokens fora do núcleo da aplicação.

### 3. Camada de Apresentação (`src/presentation`)
É a porta de entrada para o mundo externo. Ela traduz requisições externas (HTTP) em chamadas para os Casos de Uso.

- **Routes (`src/presentation/routes.ts`):** Utiliza o framework **Elysia** para definir endpoints, validar esquemas de entrada com **Zod** e mapear as rotas para as funções correspondentes no core.

---

## 🛠 Tecnologias Utilizadas
- **Runtime:** Bun (Alta performance)
- **Web Framework:** ElysiaJS
- **ORM/Query Builder:** Drizzle ORM
- **Validação de Dados:** Zod
- **Autenticação:** Better Auth

## 📂 Estrutura de Pastas e Responsabilidades

| Caminho | Função Principal | Tecnologias Relacionadas |
| `src/core` | Regras de negócio, entidades e lógica central. | TypeScript (Pure) |
| `src/infrastructure` | Implementação de DB, autenticação e integração externa. | Drizzle, Better Auth |
| `src/presentation` | Definição de rotas, parsing de JSON e validação HTTP. | Elysia, Zod |
---

## 🚀 Como Executar

## 🐳 Containerização e CI/CD (Docker & Woodpecker)

Este projeto está preparado para deploy automatizado utilizando Docker e o pipeline Woodpecker.

### Dockerfile
A imagem é construída sobre o runtime **Bun**, garantindo alta performance e baixo consumo de recursos. O processo de inicialização foi desenhado para ser resiliente: ele automaticamente executa as migrações do banco de dados (`drizzle-kit push`) antes de iniciar a aplicação Elysia, garantindo que o esquema esteja sempre sincronizado.

### Woodpecker (CI/CD)
O arquivo `.woodpecker.yml` automatiza o workflow de deploy:
1. **Build:** Gera a imagem Docker `api-bun:latest`.
2. **Persistência:** Utiliza volumes mapeados (`/opt/api-bun/data`) para garantir que os dados do banco (SQLite) persistam entre reinicializações e deploys.
3. **Automação:** O pipeline limpa instâncias antigas, aplica as variáveis de ambiente corretas (como `DATABASE_URL` apontando para o volume) e reinicia o serviço automaticamente.

### Variáveis de Ambiente em Produção
Para o funcionamento correto no Docker, certifique-se de que:
- O mapeamento de portas está correto (ex: 3003 $\rightarrow$ 3000).
- A variável `DATABASE_URL` aponta para o caminho dentro do volume persistente.

## 🚀 Como Executar
1. Instale as dependências:
  ```bash
  bun install
  ```
2. Caso não tenha feito, executar carga do banco
  ```bash
  bunx drizzle-kit push
  ```
 
3. Execute o servidor em modo desenvolvimento:
  ```bash
  bun run dev
  ```
O servidor estará disponível em `http://localhost:3000`.

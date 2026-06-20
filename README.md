# API Bun - Clean Architecture Edition

Este projeto é uma API desenvolvida com o runtime **Bun** e o framework **Elysia**, estruturada sob os princípios da **Clean Architecture (Arquitetura Limpa)**. 

A arquitetura foi desenhada para garantir que a lógica de negócio seja independente de ferramentas externas, facilitando manutenções, testes e substituições tecnológicas sem impactar o núcleo do sistema.

---

## 🏗 Arquitetura do Projeto

O projeto é dividido em camadas concêntricas, onde as dependências apontam sempre para dentro (em direção ao centro/core).

### 1. Camada de Core (`src/core`)
É o "coração" da aplicação. Esta camada não conhece nada sobre banco de dados, protocolos de rede ou frameworks web. Ela contém apenas a lógica de negócio pura.

* **Domain (`src/core/domain`):** Define os objetos de domínio e as interfaces (contratos) que o sistema deve seguir. Por exemplo, define o que é um "Usuário" e quais métodos um repositório de usuários deve ter, sem implementar nada técnico.
* **Use Cases (`src/core/usecases`):** Contêm a lógica de execução das ações do usuário (ex: cadastrar_usuario, buscar_perfil). Eles coordenam o fluxo de dados entre os objetos de domínio e as abstrações de infraestrutura.

### 2. Camada de Infraestrutura (`src/infrastructure`)
Esta camada lida com detalhes técnicos e ferramentas externas. Ela implementa as interfaces definidas na camada de Core.

* **Repositories (`src/infrastructure/repositories`):** Implementam o acesso a dados (neste caso, utilizando **Drizzle ORM**). Se no futuro decidirmos trocar o banco de dados ou o ORM, apenas esta pasta será alterada.
* **Auth (`src/infrastructure/auth.ts`):** Contém as integrações com sistemas de autenticação (como **Better Auth**), tratando a lógica complexa de sessões e tokens fora do núcleo da aplicação.

### 3. Camada de Apresentação (`src/presentation`)
É a porta de entrada para o mundo externo. Ela traduz requisições externas (HTTP) em chamadas para os Casos de Uso.

* **Routes (`src/presentation/routes.ts`):** Utiliza o framework **Elysia** para definir endpoints, validar esquemas de entrada com **Zod** e mapear as rotas para as funções correspondentes no core.

---

## 🛠 Tecnologias Utilizadas

* **Runtime:** Bun (Alta performance)
* **Web Framework:** ElysiaJS
* **ORM/Query Builder:** Drizzle ORM
* **Validação de Dados:** Zod
* **Autenticação:** Better Auth

---

## 📂 Estrutura de Pastas e Responsabilidades

| Caminho | Função Principal | Tecnologias Relacionadas |
| :--- | :--- | :--- |
| `src/core` | Regras de negócio, entidades e lógica central. | TypeScript (Pure) |
| `src/infrastructure` | Implementação de DB, autenticação e integração externa. | Drizzle, Better Auth |
| `src/presentation` | Definição de rotas, parsing de JSON e validação HTTP. | Elysia, Zod |

---

## 🐳 Containerização e CI/CD (Docker & Woodpecker)

Este projeto possui uma esteira de deploy 100% automatizada através do **Woodpecker CI** e **Gitea**, dividida em dois ambientes isolados.

### Ambientes
1.  **Homologação (Staging):** Atualizado automaticamente a cada `push` na branch `main`. Ideal para testes contínuos de integração.
2.  **Produção Oficial:** Atualizado exclusivamente mediante a criação de uma **Tag de Versão** (ex: `v1.0.0`). O pipeline gera automaticamente as *Release Notes* no repositório.

### Ciclo de Vida do Container
A imagem é construída sobre o runtime **Bun** (`oven/bun:alpine`). O ecossistema é gerenciado via Docker Compose, utilizando volumes mapeados (ex: `/opt/api-bun/data`) para persistência do banco de dados SQLite. As credenciais e portas de cada ambiente são blindadas e injetadas via *Secrets* do CI/CD.

---

## 🚀 Como Executar Localmente

1. Instale as dependências:
```bash
bun install
```

2. Sincronize o esquema do banco de dados (Carga inicial):
```bash
bunx drizzle-kit push
```

3. Execute o servidor em modo de desenvolvimento:
```bash
bun run dev
```

O servidor estará disponível e escutando na porta configurada (padrão: http://localhost:3000).

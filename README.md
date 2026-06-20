# API Bun - Clean Architecture Edition

Este projeto é uma API de alta performance desenvolvida com o runtime **Bun** e o framework **Elysia**, estruturada sob os rigorosos princípios da **Clean Architecture (Arquitetura Limpa)** e utilizando **Injeção de Dependências**.

A arquitetura foi desenhada para garantir que a lógica de negócio seja independente de ferramentas externas, facilitando manutenções, testes e substituições tecnológicas sem impactar o núcleo do sistema.

---

## ✨ Principais Funcionalidades

* **RBAC (Role-Based Access Control):** Controle de acesso a rotas restrito por papéis configuráveis (ADMIN, EDITOR e VIEWER).  
* **Tratamento Global de Erros e Dicionário Unificado:** Interceptação centralizada de falhas mapeadas através de um dicionário global, eliminando *magic strings* e números soltos em toda a aplicação.  
* **Logs Estruturados (JSON):** Implementação de observabilidade avançada, exportando eventos e erros em formato JSON para fácil rastreio por ferramentas de monitoramento.  
* **Documentação Dinâmica:** Integração nativa com OpenAPI/Swagger.  
* **Seed Automático:** Criação automatizada e segura do usuário administrador padrão durante a inicialização.  
* **Alta Performance em I/O:** Operações reativas no banco de dados, reduzindo latência.

---

## **🏗 Arquitetura do Projeto**

### **1\. Camada de Core (src/core)**

O "coração" da aplicação. Independente de banco de dados ou frameworks.

* **Domain:** Define o que é um "Usuário" e contratos de repositório.  
* **Use Cases:** Lógica de negócio pura que coordena ações.  
* **Errors & Messages:** Central unificada de respostas e exceções (messages.ts e AppError). Padroniza códigos internos, respostas de sucesso e mensagens de falha, garantindo que a API "fale" um idioma único e imutável.

### **2\. Camada de Infraestrutura (src/infrastructure)**

Implementação de detalhes técnicos.

* **Repositories:** Acesso a dados otimizado (Drizzle ORM).  
* **Auth:** Integração com Better Auth e scripts de *seed* inicial.

### **3\. Injeção de Dependências (Awilix)**

Gerencia o ciclo de vida dos objetos, mapeando interfaces para implementações, facilitando testes e desacoplamento.

### **4\. Camada de Apresentação (src/presentation)**

Porta de entrada HTTP. Traduz requisições para os Casos de Uso.

* **Routes & Middlewares:** Validação com Zod e controle de acesso via RBAC. O interceptador global de erros desta camada traduz automaticamente as exceções do domínio em respostas HTTP seguras e padronizadas.

---

## **📈 Observabilidade e Monitoramento de Logs**

Para garantir a confiabilidade do sistema em produção, o uso de console.log livre foi substituído pelo **Pino**, um logger de altíssima performance.

* **Propósito:** O Pino transforma todos os avisos e erros críticos da aplicação em **JSON estruturado**.  
* **Vantagens:** Isso permite que o contexto completo do erro (método HTTP, rota acionada, *stack trace* e código de falha) seja perfeitamente lido e indexado por ferramentas de infraestrutura como o **Dozzle** (que permite consultas SQL sobre os logs) ou o **Grafana Loki**. Assim, torna-se possível configurar alertas automatizados (ex: Discord/Slack) sempre que um erro fatal ocorrer na API.

---

## **🛠 Tecnologias Utilizadas**

* **Runtime:** Bun  
* **Web Framework:** ElysiaJS  
* **Injeção de Dependências:** Awilix  
* **ORM:** Drizzle ORM  
* **Validação:** Zod  
* **Autenticação:** Better Auth  
* **Logger/Observabilidade:** Pino

---

## **📂 Estrutura de Pastas**

| Caminho | Função |
| :---- | :---- |
| src/core | Negócio, interfaces, central de erros e dicionário global. |
| src/infrastructure | DB, Auth e Sementes. |
| src/container.ts | Resolução de DI. |
| src/presentation | Rotas, Middlewares e OpenAPI. |

---

## **🐳 Containerização e CI/CD (Docker & Woodpecker)**

Este projeto possui uma esteira de deploy 100% automatizada através do **Woodpecker CI** e **Gitea**, dividida em dois ambientes isolados.

### **Ambientes**

* **Homologação (Staging):** Atualizado automaticamente a cada push na branch main. Ideal para testes contínuos de integração.  
* **Produção:** Atualizado exclusivamente mediante a criação de uma **Tag de Versão** (ex: v1.0.0). O pipeline gera automaticamente as *Release Notes* no repositório.

### **Ciclo de Vida do Container**

A imagem é construída sobre o runtime **Bun** (oven/bun:alpine). O ecossistema é gerenciado via Docker Compose, utilizando volumes mapeados (ex: /opt/api-bun/data) para persistência do banco de dados SQLite. As credenciais e portas de cada ambiente são blindadas e injetadas via *Secrets* do CI/CD.

---

## **🚀 Como Executar Localmente**

1. **Instale as dependências:**
   ```bash
   bun install
   ```

2. **Sincronize o banco de dados:**
   ```bash
   bunx drizzle-kit push
   ```

3. **Execute:**
   ```bash
   bun run dev
   ```

### **Testes Automatizados**

1. **Como Executar Testes Unitários Localmente**
   ```bash
   bun test
   ```

---

## **👑 Acesso Inicial (Admin Padrão)**

**O servidor estará disponível e escutando na porta configurada (padrão: http://localhost:3000)**

* **E-mail:** `admin@admin.com`  
* **Senha:** `admin1234`

---
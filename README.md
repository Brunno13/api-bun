# API Bun - Clean Architecture

A high-performance API built with the **Bun** runtime and **Elysia**. It follows **Clean Architecture** principles and uses **Dependency Injection**. The design ensures business logic is independent of external tools, facilitating maintenance and testing.

---

## ✨ Key Features

* **RBAC (Role-Based Access Control):** Controlled access by roles (ADMIN, EDITOR, VIEWER).
* **Global Error Handling:** Centralized error management to eliminate magic strings.
* **Structured Logs (JSON):** High-performance observability for monitoring tools.
* **Dynamic Documentation:** Native OpenAPI/Swagger integration.
* **Automatic Seeding:** Automated creation of the default admin user on startup.
* **High I/O Performance:** Reactive database operations.

---

## 🏗️ Architecture

### **1. Core Layer (`src/core`)**
The business logic center, independent of databases or frameworks.
* **Domain:** Defines entities and repository interfaces.
* **Use Cases:** Pure business logic coordinating system actions.
* **Errors & Messages:** Centralized responses and exceptions (via `messages.ts` and `AppError`).

### **2. Infrastructure Layer (`src/infrastructure`)**
Technical implementations.
* **Repositories:** Data access using **Drizzle ORM**.
* **Auth:** Integration with **Better Auth** and seeding scripts.

### **3. Dependency Injection (Awilix)**
Manages object lifecycles, mapping interfaces to implementations for decoupling.

### **4. Presentation Layer (`src/presentation`)**
HTTP entry point. Translates requests into Use Cases.
* **Routes & Middlewares:** Uses **Zod** for validation and middleware for RBAC. Includes a global error interceptor for standardized HTTP responses.

---

## 📈 Observability and Logging

The project uses **Pino** for high-performance structured logging in JSON format. This allows tools like **Dozzle** or **Grafana Loki** to index logs for automated monitoring and alerting.

---

## 🛠️ Tech Stack

* **Runtime:** Bun  
* **Web Framework:** ElysiaJS  
* **Dependency Injection:** Awilix  
* **ORM:** Drizzle ORM  
* **Validation:** Zod  
* **Authentication:** Better Auth  
* **Logger:** Pino

---

## 📂 Folder Structure

| Path | Function |
| :---- | :---- |
| `src/core` | Business logic, interfaces, errors, and global messages. |
| `src/infrastructure` | DB, Auth, and Seeding. |
| `src/container.ts` | Dependency Injection setup. |
| `src/presentation` | Routes, Middlewares, and OpenAPI. |

---

## 🐳 Containerization & CI/CD (Docker & Woodpecker)

Automated deployment via **Woodpecker CI** and **Giteat** across two environments:

### **Environments**
* **Staging:** Automatically updated on every push to the `main` branch.
* **Production:** Updated only when a new **Version Tag** (e.g., `v1.0.0`) is created.

### **Container Lifecycle**
Built using `oven/bun:alpine`. Managed with Docker Compose, using volumes for SQLite persistence. Credentials and ports are injected via CI/CD Secrets.

---

## 🚀 Local Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Sync the database:**
   ```bash
   bunx drizzle-kit push
   ```

3. **Run the application:**
   ```bash
   bun run dev
   ```

---

## ✅ Automated Tests

1. **Run Unit Tests:**

   ```bash
   bun test
   ```

---

## 👑 Default Admin Access

**The server is available at: `http://localhost:3000`**

* **Email:** `admin@admin.com`  
* **Password:** `admin1234`

---
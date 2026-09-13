# API Bun - Clean Architecture

A high-performance REST API built with **Bun**, **ElysiaJS**, and **TypeScript**, following Clean Architecture principles and using Dependency Injection with Awilix.

The project is designed to keep business rules independent from frameworks, databases, and external services, while providing a strong baseline for security, automated testing, static analysis, and continuous delivery.

---

## ✨ Key Features

- **Clean Architecture**
  - Clear separation between domain, infrastructure, and presentation layers.
  - Business rules remain independent from HTTP, database, and external services.

- **RBAC (Role-Based Access Control)**
  - Application roles:
    - `ADMIN`
    - `EDITOR`
    - `VIEWER`
  - Route-level authorization middleware.

- **Authentication**
  - Better Auth integration.
  - Session-based authentication.
  - Environment-driven configuration.
  - Optional administrator bootstrap without hardcoded production credentials.

- **Global Error Handling**
  - Standardized API error responses.
  - Centralized user-facing messages and error codes.
  - Internal logs remain separate from API contracts.

- **Validation**
  - Request validation using Zod.
  - Standardized HTTP `422` responses for invalid input.

- **Structured Logging**
  - JSON logs using Pino.
  - Suitable for log aggregation and monitoring tools.

- **OpenAPI Documentation**
  - OpenAPI schema generated dynamically.
  - Better Auth routes integrated into the API documentation.

- **Security & Code Quality**
  - TypeScript strict type checking.
  - Type-aware ESLint analysis.
  - SAST with Opengrep.
  - Vulnerability and configuration scanning with Trivy.
  - Git history secret scanning with Gitleaks.
  - Automated test coverage gate.

---

## 🏗️ Architecture

### Core Layer — `src/core`

Contains application and business rules.

```text
src/core
├── domain
├── errors
├── messages
├── repositories
├── usecases
└── utils
```

Responsibilities include:

- Domain entities and contracts.
- Repository interfaces.
- Business use cases.
- Application errors.
- API-facing messages and error codes.

The Core layer does not depend on database or HTTP implementations.

### Infrastructure Layer — `src/infrastructure`

Contains technical implementations required by the application.

```text
src/infrastructure
├── auth
├── db
└── repositories
```

Responsibilities include:

- Better Auth integration.
- SQLite / Drizzle ORM database access.
- Repository implementations.
- Administrator bootstrap adapter.

### Presentation Layer — `src/presentation`

Contains the HTTP interface.

```text
src/presentation
├── middlewares
├── routes
└── routes.ts
```

Responsibilities include:

- HTTP routes.
- Request validation.
- Authentication and authorization.
- Global error handling.
- OpenAPI integration.

### Dependency Injection

Awilix is used to connect application contracts to their implementations.

This keeps use cases decoupled from infrastructure and makes the application easier to test.

---

## 🔐 Authentication and Administrator Bootstrap

Authentication is implemented using **Better Auth**.

Sensitive configuration is provided through environment variables and is never intended to be committed to the repository.

The initial administrator account is optional and controlled through:

```env
BOOTSTRAP_ADMIN_EMAIL=
BOOTSTRAP_ADMIN_PASSWORD=
```

If these variables are not configured, administrator bootstrap is skipped.

If the account already exists, no new account is created.

The application does **not** rely on hardcoded default administrator credentials.

Better Auth itself is configured through environment variables such as:

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

Use `.env.example` only as a configuration reference and keep real credentials in a local `.env.local` or in the deployment/CI secret store.

---

## 🛡️ Security Pipeline

Security analysis is executed automatically in the self-hosted CI pipeline.

### Opengrep

Used as the primary SAST scanner.

It analyzes the TypeScript source code for security-sensitive patterns and static-analysis findings.

### Trivy

Used to analyze:

- Dependency vulnerabilities.
- Container image vulnerabilities.
- Docker and configuration misconfigurations.
- Secrets present in the current project state.

The production container baseline currently passes with:

```text
VULNERABILITIES=0
MISCONFIGURATIONS=0
SECRETS=0
```

### Gitleaks

Used specifically for Git-aware secret detection.

Unlike a current-files-only scan, Gitleaks also checks Git history so that a secret cannot be hidden simply by removing it in a later commit.

The CI gate checks both:

```text
Git history
Current HEAD
```

Historical findings that were explicitly reviewed can be fingerprinted individually, while any new secret finding fails the security gate.

---

## ✅ Code Quality

The project uses several independent quality gates rather than relying on a single monolithic analysis platform.

### TypeScript

Type checking is executed with:

```bash
bun run typecheck
```

Equivalent to:

```bash
tsc --noEmit
```

### ESLint

ESLint uses `typescript-eslint` with type-aware analysis.

```bash
bun run lint
```

The current configuration uses TypeScript project information through `projectService`, allowing ESLint rules to reason about actual TypeScript types instead of only syntax.

The current quality baseline contains:

```text
TypeScript errors: 0
ESLint errors:     0
```

No `eslint-disable` directives were introduced merely to silence the baseline.

---

## 🧪 Automated Tests

Tests use Bun's native test runner.

Run the normal test suite with:

```bash
bun run test
```

Current validated baseline:

```text
38 pass
0 fail
93 expect() calls
```

The test suite currently covers areas including:

- Core use cases.
- Repository behavior.
- Authentication bootstrap rules.
- RBAC.
- Unauthorized access.
- Global API error handling.
- Request validation.
- Upload routes and failure scenarios.

---

## 📊 Test Coverage

Coverage is generated by Bun:

```bash
bun run test:coverage
```

The project generates both:

```text
text report
LCOV
```

Test files are excluded from production coverage calculations.

The current Bun textual baseline is approximately:

```text
Functions  88.64%
Lines      94.59%
```

The aggregated LCOV baseline is:

```text
Functions   59/63   = 93.65%
Lines      594/624  = 95.19%
```

### Coverage Gate

The CI coverage gate uses the aggregated LCOV report instead of Bun's per-file threshold mechanism.

Current minimum thresholds:

```text
Lines      >= 94.50%
Functions  >= 93.00%
```

Run the complete coverage gate locally with:

```bash
bun run coverage:check
```

A successful run produces:

```text
COVERAGE_GATE=PASS
```

The coverage checker also returns a non-zero exit code when the configured baseline is violated, allowing CI to block coverage regressions.

---

## 🔄 CI/CD

The project uses a **self-hosted Woodpecker CI** environment connected to Gitea.

GitHub is used as a public repository/mirror, while CI execution remains self-hosted.

The quality workflow currently executes:

```text
security-gitleaks
      ↓
quality-install
      ↓
quality-typecheck
      ↓
quality-lint
      ↓
quality-tests
      ↓
quality-coverage
      ↓
quality-summary
```

A successful quality pipeline ends with:

```text
QUALITY_INSTALL=PASS
QUALITY_TYPECHECK=PASS
QUALITY_LINT=PASS
QUALITY_TESTS=PASS
QUALITY_COVERAGE=PASS
QUALITY_GATE=PASS
```

The Linux quality workloads run on an amd64 self-hosted CI worker.

---

## 🐳 Container Security

The production image is based on:

```text
oven/bun:alpine
```

The runtime container follows a non-root execution model:

```text
USER=bun
UID/GID=1000:1000
```

Application data stored under `/app/data` uses filesystem permissions compatible with the non-root runtime user.

The image also includes an HTTP healthcheck.

Container hardening validated during CI includes:

```text
non-root runtime
writable application data volume
working database migrations
working healthcheck
no embedded application secrets
Trivy security gate
```

Secrets and environment-specific credentials are injected at deployment time instead of being baked into the image.

---

## 📈 Observability and Logging

The application uses **Pino** for structured JSON logging.

This makes logs suitable for aggregation systems such as:

- Dozzle
- Grafana Loki
- Other JSON-compatible observability platforms

Application-facing API messages are centralized separately from internal operational logs.

---

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| Runtime | Bun |
| Language | TypeScript |
| Web Framework | ElysiaJS |
| Dependency Injection | Awilix |
| ORM | Drizzle ORM |
| Database | SQLite |
| Validation | Zod |
| Authentication | Better Auth |
| Logging | Pino |
| API Documentation | OpenAPI |
| Testing | Bun Test |
| Linting | ESLint + typescript-eslint |
| SAST | Opengrep |
| Vulnerability Scan | Trivy |
| Secret Scan | Gitleaks |
| CI/CD | Woodpecker CI |
| Container | Docker |

---

## 📂 Project Structure

```text
.
├── scripts/
│   └── check-coverage.ts
├── src/
│   ├── core/
│   ├── infrastructure/
│   ├── presentation/
│   ├── config.ts
│   ├── container.ts
│   └── index.ts
├── .woodpecker/
├── bunfig.toml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 🚀 Local Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Use `.env.example` as the reference for the required configuration.

For local development, keep real values outside version control, for example in:

```text
.env.local
```

### 3. Synchronize the database

```bash
bunx drizzle-kit push
```

### 4. Start development mode

```bash
bun run dev
```

The API is available by default at:

```text
http://localhost:3000
```

---

## 🧰 Development Commands

```bash
# Start development mode
bun run dev

# TypeScript validation
bun run typecheck

# ESLint
bun run lint

# Tests
bun run test

# Tests with coverage
bun run test:coverage

# Tests + coverage regression gate
bun run coverage:check
```

---

## 🔒 Security Notes

Do not commit:

```text
.env.local
authentication secrets
bootstrap passwords
deployment credentials
CI tokens
S3 credentials
```

Real deployment secrets should be managed through the appropriate CI/CD secret store or runtime environment.

The repository `.env.example` must contain only placeholders and documentation-safe values.

---

## 📌 Quality Baseline

Current validated quality state:

```text
TypeScript             PASS
ESLint type-aware      PASS
Tests                  38 PASS / 0 FAIL
Coverage gate          PASS
Opengrep                PASS
Trivy                   PASS
Gitleaks                PASS
Container non-root      PASS
```

The intent of this baseline is not to maximize metrics artificially, but to prevent regressions while keeping tests and static analysis focused on meaningful application behavior.

---
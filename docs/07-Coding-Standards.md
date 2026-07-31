# 07-Coding-Standards.md

# 1. Purpose

This document defines the engineering standards for developing the AgriSmart backend.

Its objective is to ensure that all contributors follow consistent coding practices, architectural principles, and quality expectations throughout the project lifecycle.

These standards improve readability, maintainability, collaboration, and long-term scalability.

# 2. Engineering Principles

Development of the AgriSmart backend follows these engineering principles:

## EP-001 Consistency Over Personal Preference

Code should follow the established project conventions rather than individual developer preferences.

---

## EP-002 Readability First

Code should be easy to understand before it is optimized.

---

## EP-003 Single Responsibility

Every module, class, and function should have one primary responsibility.

---

## EP-004 Separation of Concerns

Business logic, HTTP handling, persistence, and infrastructure concerns should remain separated.

---

## EP-005 Reusability

Reusable functionality should be extracted into shared components where appropriate.

---

## EP-006 Simplicity

Prefer simple solutions unless additional complexity provides measurable value.

---

## EP-007 Explicitness

Code should be explicit rather than relying on hidden behavior or assumptions.

---

## EP-008 Security by Default

Security considerations should be incorporated into implementation decisions rather than added later.

---

## EP-009 Testability

Code should be designed so that business logic can be tested independently of infrastructure.

---

## EP-010 Continuous Improvement

The codebase should improve over time through incremental refactoring and documentation updates.

# 3. Project Structure

## 3.1 Purpose

This section defines the standard directory structure for the AgriSmart backend.

The project structure is designed to support modular development, clear separation of concerns, and long-term maintainability.

All source code should follow this structure unless a documented architectural decision requires otherwise.

## 3.2 Project Organization Principles

The project structure follows these principles:

- Business modules are the primary organizational unit.
- Shared infrastructure is centralized.
- Business logic remains independent of HTTP and database concerns.
- Related files should be located together.
- Every directory should have a clear responsibility.

## 3.3 Root Directory Structure

```text
agri-smart-api/
│
├── docs/
├── src/
├── tests/
├── scripts/
├── uploads/                 (development only, if needed)
├── .github/
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml
```

## 3.4 Source Directory Structure

```text
src/
│
├── app/
│
├── config/
│
├── middleware/
│
├── routes/
│
├── shared/
│
├── utils/
│
├── types/
│
├── constants/
│
├── app.ts
└── server.ts
```

## 3.5 Module Structure

Each business module shall follow a consistent internal structure.

Example:

```text
modules/
│
└── auth/
    │
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── auth.repository.ts
    ├── auth.model.ts
    ├── auth.validation.ts
    ├── auth.route.ts
    ├── auth.interface.ts
    ├── auth.constant.ts
    └── auth.types.ts
```

## 3.6 Planned Business Modules

The following business modules are planned for Version 1:

- Authentication
- User Profile
- Dashboard
- Crop Recommendation
- Disease Detection
- AI Assistant
- Admin

## 3.7 Shared Directories

Shared functionality that is reused across multiple modules should be placed in dedicated shared directories.

Examples include:

- Configuration
- Error handling
- Logging
- Authentication utilities
- Validation helpers
- Common middleware
- Shared types
- Constants

## 3.8 Dependency Direction

Dependencies should flow inward according to the layered architecture.

Allowed dependency flow:

```text
Routes
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Models
```

Shared utilities may be used by any layer where appropriate.

Lower layers should not depend on higher layers.

## 3.9 Project Growth

As the project evolves:

- New business capabilities should be introduced as new modules.
- Existing modules should remain cohesive.
- Shared functionality should not become a catch-all location for unrelated code.
- Architectural consistency should take priority over short-term convenience.

# 4. Naming Conventions

## 4.1 Naming Principles

The AgriSmart backend follows these naming principles:

- Names should clearly express intent.
- Use full words instead of abbreviations where practical.
- Maintain consistency across all modules.
- Prefer descriptive names over clever names.
- Follow established TypeScript and JavaScript conventions.

## 4.2 Naming Categories

### Files

File names shall use lowercase kebab-case.

Feature-specific files should include the feature name followed by their responsibility.

Examples:

- `auth.controller.ts`
- `auth.service.ts`
- `auth.repository.ts`
- `auth.model.ts`
- `auth.validation.ts`
- `auth.route.ts`
- `profile.controller.ts`
- `crop-recommendation.service.ts`

### Folders

Folder names shall use lowercase camelCase or lowercase single-word names.

Business modules should use descriptive names.

Examples:

- `modules/`
- `auth/`
- `profile/`
- `dashboard/`
- `cropRecommendation/`
- `diseaseDetection/`
- `aiAssistant/`
- `shared/`
- `middleware/`
- `config/`

### Variables

Variables shall use camelCase.

Variable names should clearly describe the stored value.

Examples:

- `user`
- `currentUser`
- `accessToken`
- `refreshToken`
- `cropRecommendation`
- `diseaseReport`
- `conversationHistory`

### Functions

Function names shall use camelCase.

Functions should begin with a verb describing their behavior.

Examples:

- `createUser()`
- `loginUser()`
- `updateProfile()`
- `detectDisease()`
- `generateRecommendation()`
- `sendMessage()`

### Classes

Class names shall use PascalCase.

Class names should represent business concepts or technical responsibilities.

Examples:

- `AuthService`
- `ProfileRepository`
- `DiseaseDetector`
- `ApiError`
- `EmailService`

### Interfaces

Interface names shall use PascalCase.

Do not prefix interface names with "I".

Examples:

- `User`
- `JwtPayload`
- `LoginRequest`
- `ProfileDocument`
- `CropRecommendationResult`

### Types

Custom type aliases shall use PascalCase.

Examples:

- `UserRole`
- `TokenPayload`
- `ApiResponse`
- `PaginationOptions`
- `DiseaseSeverity`

### Enums

Enum names shall use PascalCase.

Enum members shall use PascalCase.

Examples:

UserRole:
- `Farmer`
- `Admin`

DiseaseSeverity:
- `Low`
- `Medium`
- `High`

### Constants

Constant identifiers shall use UPPER_SNAKE_CASE.

Examples:

- `MAX_FILE_SIZE`
- `DEFAULT_PAGE_SIZE`
- `JWT_EXPIRES_IN`
- `PASSWORD_MIN_LENGTH`
- `SUPPORTED_IMAGE_TYPES`

### Environment Variables

Environment variable names shall use UPPER_SNAKE_CASE.

Examples:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `OPENAI_API_KEY`

# 5. Layer Responsibilities

## 5.1 Purpose

This section defines the responsibilities of each architectural layer within the AgriSmart backend.

Each layer has a clearly defined purpose and should avoid taking responsibilities assigned to other layers.

## 5.2 Routes

Responsibilities:

- Define API endpoints.
- Apply middleware.
- Forward requests to controllers.

Routes should NOT:

- Contain business logic.
- Access the database.
- Perform validation beyond routing concerns.

## 5.3 Controllers

Responsibilities:

- Receive HTTP requests.
- Extract request data.
- Invoke services.
- Return standardized HTTP responses.

Controllers should NOT:

- Implement business rules.
- Access the database directly.
- Contain complex business logic.

## 5.4 Services

Responsibilities:

- Implement business logic.
- Coordinate multiple repositories.
- Enforce business rules.
- Orchestrate workflows.
- Communicate with external services.

Services should NOT:

- Handle HTTP concerns.
- Build HTTP responses.
- Depend directly on routing.

## 5.5 Repositories

Responsibilities:

- Perform data access operations.
- Encapsulate database queries.
- Persist and retrieve business entities.

Repositories should NOT:

- Implement business rules.
- Perform request validation.
- Handle HTTP responses.

## 5.6 Models

Responsibilities:

- Represent business entities.
- Define persistence structures.
- Configure entity relationships.
- Support data validation at the persistence layer where appropriate.

Models should NOT:

- Implement business workflows.
- Depend on controllers or services.

## 5.7 Middleware

Responsibilities:

- Process requests before controllers.
- Handle authentication.
- Handle authorization.
- Perform request validation.
- Apply rate limiting.
- Handle cross-cutting concerns.

Middleware should NOT:

- Implement business workflows.
- Access business repositories unless absolutely necessary.

## 5.8 Utilities

Responsibilities:

- Provide reusable helper functionality.
- Remain independent of business modules.
- Support multiple layers without introducing coupling.

Utilities should NOT:

- Contain business rules.
- Depend on application-specific modules.

## 5.9 Dependency Rules

Allowed dependency direction:

```text
Routes
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Models
```

Shared modules, configuration, and utilities may be used where appropriate.

Lower layers shall not depend on higher layers.

# 6. Error Handling Standards

## 6.1 Purpose

This section defines the project's standards for detecting, handling, and reporting errors consistently across the AgriSmart backend.

The objective is to provide predictable behavior for API consumers while supporting efficient debugging and operational monitoring.

## 6.2 Principles

Error handling shall follow these principles:

- Fail fast when invalid input or invalid state is detected.
- Return standardized API error responses.
- Do not expose internal implementation details.
- Log unexpected errors for operational investigation.
- Handle anticipated business errors gracefully.

## 6.3 Error Categories

The application distinguishes the following error categories:

- Validation Errors
- Authentication Errors
- Authorization Errors
- Business Rule Errors
- Resource Not Found Errors
- External Service Errors
- Internal Server Errors

## 6.4 Responsibilities

Error handling responsibilities are divided as follows:

Routes
- Forward requests.

Controllers
- Return standardized error responses.

Services
- Detect business rule violations.

Repositories
- Surface persistence-related failures.

Middleware
- Capture unhandled exceptions and produce consistent API responses.

## 6.5 Error Response Rules

All API errors shall:

- Follow the standard response format.
- Include a meaningful error message.
- Return the appropriate HTTP status code.
- Avoid exposing stack traces or infrastructure details.

# 7. Logging Standards

## 7.1 Purpose

This section defines how application events should be logged to support debugging, monitoring, auditing, and operational visibility.

## 7.2 Logging Principles

Logging shall:

- Provide meaningful operational information.
- Support troubleshooting.
- Avoid unnecessary verbosity.
- Protect sensitive information.
- Be consistent across all modules.

## 7.3 Log Levels

The application shall support multiple log levels.

Typical levels include:

- Debug
- Info
- Warn
- Error
- Fatal

## 7.4 What Should Be Logged

Examples include:

- Application startup
- Application shutdown
- Authentication events
- Authorization failures
- Validation failures
- External API failures
- Unexpected exceptions
- Background jobs

## 7.5 Sensitive Information

The following information shall not be written to application logs:

- Passwords
- Authentication tokens
- API secrets
- Encryption keys
- Personal sensitive information unless required for auditing

## 7.6 Structured Logging

Application logs should use structured formats to improve searching, filtering, and monitoring.

Log entries should include contextual information where appropriate, such as request identifiers and timestamps.

# 8. Validation Standards

## 8.1 Purpose

This section defines how input validation is performed throughout the AgriSmart backend to ensure data integrity and system reliability.

## 8.2 Validation Principles

Validation shall:

- Occur before business logic executes.
- Reject invalid requests immediately.
- Produce standardized validation errors.
- Enforce business constraints where appropriate.
- Protect downstream application layers.

## 8.3 Validation Responsibilities

Validation responsibilities include:

Request Validation
- Validate incoming request payloads.

Business Validation
- Validate business rules.

Persistence Validation
- Validate data before persistence where applicable.

## 8.4 Validation Rules

Validation should verify:

- Required fields
- Data types
- String lengths
- Numeric ranges
- Allowed values
- Resource identifiers
- File constraints
- Business-specific rules

## 8.5 Validation Failures

Validation failures shall:

- Return standardized API responses.
- Identify invalid fields where appropriate.
- Avoid exposing implementation details.

# 9. API Standards

## 9.1 Purpose

This section defines implementation standards for REST APIs to ensure consistency, predictability, and maintainability across the AgriSmart backend.

## 9.2 REST Principles

The API shall:

- Use resource-oriented endpoints.
- Follow standard HTTP methods.
- Remain stateless.
- Return standardized responses.
- Use appropriate HTTP status codes.

## 9.3 Endpoint Naming

Endpoints shall:

- Use plural resource names.
- Use lowercase letters.
- Use hyphens to separate words.
- Avoid verbs within resource paths where practical.

Examples:

- `/users`
- `/disease-reports`
- `/crop-recommendations`

## 9.4 HTTP Methods

Standard HTTP methods shall be used consistently.

GET
- Retrieve resources.

POST
- Create resources.

PATCH
- Partially update resources.

PUT
- Replace resources where appropriate.

DELETE
- Remove resources.

## 9.5 Response Standards

All endpoints shall:

- Return standardized response structures.
- Use consistent success messages.
- Return meaningful error messages.
- Preserve backward compatibility.

## 9.6 Pagination

Collection endpoints should support:

- Pagination
- Filtering
- Sorting
- Search where applicable

## 9.7 API Documentation

Every public endpoint should be documented with:

- Purpose
- Authentication requirements
- Request format
- Response format
- Possible error responses

# 10. Database Standards

## 10.1 Purpose

This section defines the standards for designing, accessing, and maintaining the application's database.

The objective is to ensure consistency, data integrity, performance, and maintainability throughout the lifecycle of the AgriSmart backend.

## 10.2 General Principles

Database design shall follow these principles:

- Model business concepts clearly.
- Avoid unnecessary data duplication.
- Store only required information.
- Design for readability before optimization.
- Keep schemas consistent across modules.

## 10.3 Schema Standards

Database schemas shall:

- Use meaningful field names.
- Include appropriate validation rules.
- Define sensible default values where applicable.
- Store timestamps for auditing.
- Follow consistent naming conventions.

## 10.4 Query Standards

Database queries should:

- Retrieve only required fields.
- Use indexes efficiently.
- Avoid unnecessary database round trips.
- Support pagination for large datasets.
- Handle failures gracefully.

## 10.5 Data Integrity

The application shall protect data integrity by:

- Validating data before persistence.
- Enforcing business constraints in the service layer.
- Preventing invalid state transitions.
- Maintaining referential consistency between related entities.

## 10.6 Audit Fields

Every primary business entity should include:

- `createdAt`
- `updatedAt`

Where appropriate, additional audit fields may include:

- `createdBy`
- `updatedBy`
- `deletedAt`

## 10.7 Soft Delete

Business entities that may require recovery or auditing should use a soft delete strategy instead of permanent deletion.

Soft-deleted records should not appear in normal application queries.

## 10.8 Performance

Database performance should be maintained through:

- Appropriate indexing
- Efficient query design
- Pagination
- Query optimization
- Periodic performance review

# 11. Security Standards

## 11.1 Purpose

This section defines the minimum security standards for the AgriSmart backend.

Security shall be considered throughout design, implementation, deployment, and maintenance.

## 11.2 Security Principles

Development shall follow these principles:

- Security by default
- Least privilege
- Defense in depth
- Fail securely
- Protect sensitive data

## 11.3 Authentication

Authentication shall:

- Require secure credentials.
- Use JWT access and refresh tokens.
- Verify user identity before granting access.
- Expire tokens appropriately.

## 11.4 Authorization

Authorization shall:

- Verify permissions for protected resources.
- Restrict administrative functionality.
- Prevent unauthorized resource access.

## 11.5 Password Security

Passwords shall:

- Never be stored in plain text.
- Be hashed using a secure password hashing algorithm.
- Meet defined password complexity requirements.

## 11.6 Secrets Management

Application secrets shall:

- Never be committed to version control.
- Be stored in environment variables or secure secret management systems.
- Be rotated when necessary.

## 11.7 Input Security

All external input shall be:

- Validated
- Sanitized where appropriate
- Treated as untrusted

## 11.8 API Security

Protected endpoints should implement:

- Authentication
- Authorization
- Rate limiting
- Request validation
- Consistent error handling

## 11.9 Logging Security

Logs shall never contain:

- Passwords
- Tokens
- API keys
- Secrets
- Sensitive personal information unless explicitly required for auditing.

## 11.10 Dependency Security

Project dependencies should:

- Be kept reasonably up to date.
- Be reviewed for known vulnerabilities.
- Be removed when no longer required.

# 12. Git Standards

## 12.1 Purpose

This section defines the version control practices used throughout the AgriSmart backend project.

The objective is to maintain a clean commit history, simplify collaboration, and support reliable releases.

## 12.2 Branch Strategy

The project follows a feature branch workflow.

Typical branches include:

- `main`
- `develop` (optional)
- `feature/<feature-name>`
- `bugfix/<issue-name>`
- `hotfix/<issue-name>`

## 12.3 Commit Messages

Commit messages should:

- Be concise.
- Describe a single logical change.
- Use the imperative mood.

Examples:

- `feat: add user registration endpoint`
- `fix: resolve JWT expiration issue`
- `refactor: simplify authentication service`
- `docs: update API specification`
- `test: add authentication integration tests`

## 12.4 Pull Requests

Pull requests should:

- Address a single logical change.
- Include an appropriate description.
- Reference related issues where applicable.
- Be reviewed before merging when working in a team.

## 12.5 Code Reviews

Code reviews should verify:

- Correctness
- Readability
- Security
- Performance
- Consistency with project standards
- Adequate documentation

## 12.6 Repository Hygiene

The repository should:

- Keep the main branch deployable.
- Remove obsolete branches.
- Exclude generated files from version control.
- Maintain an up-to-date README and documentation.

# 13. Testing Standards

## 13.1 Purpose

This section defines the testing standards for the AgriSmart backend.

The objective is to ensure that implemented features are reliable, maintainable, and continue to function correctly as the system evolves.

## 13.2 Testing Principles

Testing shall follow these principles:

- Test business behavior rather than implementation details.
- Write tests that are deterministic and repeatable.
- Keep tests isolated and independent.
- Automate testing wherever practical.
- Prevent regressions through continuous testing.

## 13.3 Testing Levels

The project supports multiple levels of testing:

### Unit Testing

Verifies individual business logic in isolation.

Examples:
- Service methods
- Utility functions
- Validation logic

---

### Integration Testing

Verifies interactions between multiple components.

Examples:
- Controller → Service → Repository
- Database operations
- External service integrations

---

### API Testing

Verifies REST API behavior.

Examples:
- Authentication
- Request validation
- Authorization
- Response structure
- HTTP status codes

## 13.4 Test Quality

Tests should:

- Have descriptive names.
- Validate a single behavior.
- Avoid unnecessary duplication.
- Be easy to understand and maintain.

## 13.5 Test Data

Test data should:

- Be isolated from production data.
- Use realistic values where practical.
- Be created and cleaned up automatically when possible.

## 13.6 Continuous Validation

Testing should be performed:

- During feature development.
- Before merging significant changes.
- Before production releases.

# 14. Documentation Standards

## 14.1 Purpose

This section defines the standards for maintaining technical documentation throughout the AgriSmart backend project.

Documentation should remain accurate, concise, and synchronized with the implementation.

## 14.2 Documentation Principles

Documentation shall:

- Explain the purpose before implementation details.
- Be updated whenever significant changes occur.
- Be clear, concise, and consistent.
- Avoid duplication across documents.

## 14.3 Required Documentation

The project shall maintain the following documentation:

- README
- Software Requirements Specification (SRS)
- Architecture
- Database Design
- API Specification
- Architecture Decision Records (ADR)
- Development Plan
- Coding Standards
- Deployment Guide

## 14.4 Code Documentation

Code should be self-explanatory whenever possible.

Comments should explain:

- Why a decision was made.
- Non-obvious business rules.
- Complex algorithms.

Comments should not repeat what the code already makes clear.

## 14.5 API Documentation

Public APIs should document:

- Purpose
- Authentication requirements
- Request structure
- Response structure
- Error responses

## 14.6 Documentation Review

Documentation should be reviewed whenever:

- Business requirements change.
- Architecture changes.
- APIs change.
- Deployment procedures change.

# 15. Code Review Checklist

## 15.1 Purpose

This checklist defines the minimum review criteria for code changes within the AgriSmart backend.

Its objective is to maintain code quality, consistency, security, and long-term maintainability.

## 15.2 Architecture

Verify that:

- The implementation follows the documented architecture.
- Responsibilities remain in the correct layer.
- No unnecessary coupling has been introduced.
- Module boundaries remain clear.

## 15.3 Code Quality

Verify that:

- Naming conventions are followed.
- Code is readable.
- Functions remain focused.
- Unused code has been removed.
- Duplicate logic has been avoided.

## 15.4 Business Logic

Verify that:

- Business requirements are correctly implemented.
- Edge cases have been considered.
- Business rules are enforced consistently.

## 15.5 Validation & Error Handling

Verify that:

- Input validation is implemented.
- Business validation is enforced.
- Errors use the standardized response format.
- Appropriate HTTP status codes are returned.

## 15.6 Security

Verify that:

- Authentication is enforced where required.
- Authorization checks are present.
- Sensitive information is protected.
- Secrets are not exposed.
- Security standards are followed.

## 15.7 Database

Verify that:

- Queries are efficient.
- Appropriate indexes are used.
- Data integrity is preserved.
- Database interactions remain within repositories.

## 15.8 API

Verify that:

- Endpoints follow REST conventions.
- Request and response formats match the API Specification.
- Versioning rules are respected.

## 15.9 Testing

Verify that:

- New functionality has appropriate tests.
- Existing tests continue to pass.
- Critical business scenarios are covered.

## 15.10 Documentation

Verify that:

- Documentation has been updated where necessary.
- API changes are documented.
- ADRs are updated if architectural decisions have changed.

## 15.11 Final Approval

Before considering a change complete, confirm that:

- All checklist items have been reviewed.
- The application builds successfully.
- No critical issues remain unresolved.
- The implementation aligns with project standards.
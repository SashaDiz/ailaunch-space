# Architecture Decision Records (ADRs)

This document records important architectural decisions made during the development of DirectoryHunt.

## ADR-001: Choose React + Vite over Next.js

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed to choose a frontend framework and build tool for DirectoryHunt. The main options were:

- Next.js (full-stack React framework)
- React + Vite (client-side React with fast build tool)
- Vue.js + Vite
- Svelte + SvelteKit

### Decision

We chose React + Vite for the following reasons:

**Pros of React + Vite**:

- Faster development builds and hot reload
- Simpler deployment model (static frontend + serverless backend)
- Better separation of concerns
- More flexible hosting options
- Excellent developer experience with Vite

**Pros of Next.js considered**:

- Built-in API routes
- Server-side rendering
- Image optimization
- Built-in performance optimizations

### Consequences

- **Positive**: Fast development experience, simple deployment, clear separation
- **Negative**: Need to handle SSR manually if needed, more configuration required
- **Mitigation**: Use Vercel for serverless functions, implement client-side optimization

---

## ADR-002: Use MongoDB over PostgreSQL

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed to choose a database for storing user data, app submissions, votes, and analytics.

### Decision

We chose MongoDB for the following reasons:

**Pros of MongoDB**:

- Flexible schema for evolving app submission requirements
- JSON-like documents match JavaScript objects
- Excellent cloud hosting with MongoDB Atlas
- Easy horizontal scaling
- Rich query capabilities for analytics

**Pros of PostgreSQL considered**:

- ACID compliance
- Strong consistency
- Mature ecosystem
- Complex query support with SQL

### Consequences

- **Positive**: Faster development, flexible schema, easy scaling
- **Negative**: Eventual consistency, learning curve for some developers
- **Mitigation**: Use Zod for schema validation, implement proper indexing

---

## ADR-003: Use Clerk for Authentication

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed a robust authentication system supporting multiple OAuth providers.

### Decision

We chose Clerk over alternatives like Auth0, Firebase Auth, or custom implementation.

**Reasons**:

- Excellent React integration
- Multiple OAuth providers out of the box
- User management dashboard
- Webhook support for data synchronization
- Developer-friendly API
- Good documentation and community

### Consequences

- **Positive**: Fast implementation, robust features, good developer experience
- **Negative**: Vendor lock-in, monthly cost for production usage
- **Mitigation**: Abstract auth calls through custom hooks, monitor usage costs

---

## ADR-004: Use Serverless Functions over Traditional Server

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed to choose between a traditional Express server and serverless functions for the API.

### Decision

We chose Vercel serverless functions for the following reasons:

**Pros of Serverless**:

- Automatic scaling
- Pay-per-use pricing model
- No server management required
- Excellent integration with Vercel deployment
- Fast cold start times

**Pros of Traditional Server considered**:

- Persistent connections
- Shared state across requests
- More control over execution environment

### Consequences

- **Positive**: Simplified deployment, automatic scaling, cost-effective
- **Negative**: Cold start latency, stateless execution model
- **Mitigation**: Optimize function size, use connection pooling for database

---

## ADR-005: Use Tailwind CSS + Radix UI for Styling

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed a styling solution that could deliver consistent, accessible, and maintainable UI components.

### Decision

We chose Tailwind CSS + Radix UI for the following reasons:

**Tailwind CSS**:

- Utility-first approach for rapid development
- Consistent design system
- Excellent purging for small bundle sizes
- Great IDE support

**Radix UI**:

- Unstyled, accessible component primitives
- Full keyboard navigation support
- WAI-ARIA compliant
- Headless components that work with any styling

### Consequences

- **Positive**: Fast development, consistent design, excellent accessibility
- **Negative**: Learning curve for utility-first CSS, larger HTML classes
- **Mitigation**: Use component abstraction, create design system documentation

---

## ADR-006: Use Zod for Runtime Validation

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed runtime validation for API requests, form data, and database operations in a TypeScript-like environment.

### Decision

We chose Zod over alternatives like Joi, Yup, or Ajv.

**Reasons**:

- TypeScript-first design with excellent inference
- Composable and reusable schemas
- Built-in error handling and messages
- Integration with React Hook Form
- Small bundle size and good performance

### Consequences

- **Positive**: Type-safe validation, great developer experience, consistent error handling
- **Negative**: Learning curve for complex schemas
- **Mitigation**: Create reusable schema patterns, document common validation examples

---

## ADR-007: Implement Weekly Launch Schedule

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Product Team

### Context

We needed to decide how to organize and schedule app launches to create community engagement.

### Decision

We implemented a weekly launch schedule (Monday to Sunday) rather than daily or monthly cycles.

**Reasons**:

- Manageable content volume for users
- Sufficient time for community voting
- Predictable schedule for makers
- Good balance between freshness and discovery time
- Allows for weekend engagement

### Consequences

- **Positive**: Predictable schedule, manageable content volume, good engagement window
- **Negative**: Some makers may want immediate launch, weekly cycles may feel slow
- **Mitigation**: Allow makers to choose launch week, provide preview capabilities

---

## ADR-008: Use Three-Tier Submission Plans

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Product Team

### Context

We needed a monetization strategy that provides value to both free and paid users.

### Decision

We implemented three submission tiers: Standard (free), Premium ($29), Support ($99).

**Reasoning**:

- Free tier attracts users and builds community
- Premium tier provides reasonable monetization
- Support tier offers significant value (backlinks) for serious businesses
- Clear value proposition at each level

### Consequences

- **Positive**: Multiple revenue streams, clear value differentiation, accessible to all users
- **Negative**: Complex feature management, potential user confusion
- **Mitigation**: Clear pricing page, feature comparison table, upgrade paths

---

## ADR-009: Implement Soft Delete Pattern

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed to handle user and app deletions while maintaining data integrity and potential recovery.

### Decision

We implemented soft deletion using `deletedAt` timestamps rather than hard deletion.

**Reasons**:

- Maintains referential integrity
- Allows for data recovery
- Supports analytics and auditing
- Prevents cascade deletion issues
- Enables user restoration

### Consequences

- **Positive**: Data safety, recovery options, audit trail
- **Negative**: Increased storage requirements, more complex queries
- **Mitigation**: Regular cleanup jobs, proper indexing on deletedAt field

---

## ADR-010: Use Semantic Versioning for API

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Development Team

### Context

We needed a strategy for API evolution and backward compatibility.

### Decision

We use semantic versioning for API changes and maintain backward compatibility within major versions.

**Strategy**:

- Major version: Breaking changes
- Minor version: New features, backward compatible
- Patch version: Bug fixes
- API version in URL: `/api/v1/apps`

### Consequences

- **Positive**: Clear upgrade path, maintained compatibility, predictable changes
- **Negative**: Multiple API versions to maintain, increased complexity
- **Mitigation**: Deprecation notices, migration guides, automated testing

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD  
**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Deciders**: [List of people involved]

### Context

[Describe the context and problem statement]

### Decision

[Describe the decision and rationale]

### Consequences

- **Positive**: [List positive consequences]
- **Negative**: [List negative consequences]
- **Mitigation**: [How to address negative consequences]
```

---

These ADRs document the key architectural decisions that shape DirectoryHunt. They serve as historical context for future developers and help maintain consistency in our technical approach.

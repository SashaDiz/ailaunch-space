# Contributing to DirectoryHunt

Thank you for your interest in contributing to DirectoryHunt! This document provides guidelines and information for contributors.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our Code of Conduct:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and encourage diverse perspectives
- **Be collaborative**: Work together and help each other learn
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Understand that everyone has different skill levels

## How to Contribute

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Bug Report Template:**

```markdown
## Bug Description

A clear and concise description of the bug.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Screenshots

If applicable, add screenshots to help explain the problem.

## Environment

- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]
- Node.js version: [e.g. 18.17.0]

## Additional Context

Any other context about the problem.
```

### 💡 Suggesting Features

We welcome feature suggestions! Please provide:

**Feature Request Template:**

```markdown
## Feature Description

A clear and concise description of the feature you'd like to see.

## Problem Statement

What problem does this feature solve?

## Proposed Solution

Describe the solution you'd like.

## Alternatives Considered

Describe any alternative solutions you've considered.

## Additional Context

Any other context, mockups, or examples.
```

### 🔧 Contributing Code

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/directoryhunt.git
cd directoryhunt

# Add upstream remote
git remote add upstream https://github.com/original-owner/directoryhunt.git
```

#### 2. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:init

# Start development server
npm run dev
```

#### 3. Create Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# For bug fixes, use:
git checkout -b fix/issue-description
```

#### 4. Make Changes

- Follow our [coding standards](#coding-standards)
- Write tests for new functionality
- Update documentation as needed
- Ensure your changes don't break existing functionality

#### 5. Test Your Changes

```bash
# Run linting
npm run lint

# Run tests (when available)
npm run test

# Test build
npm run build

# Manual testing
npm run dev
```

#### 6. Commit Changes

Use conventional commit messages:

```bash
# Format: type(scope): description
git commit -m "feat(api): add app submission endpoint"
git commit -m "fix(ui): resolve mobile responsive issues"
git commit -m "docs(readme): update installation instructions"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

#### 7. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Pull Request Guidelines

### PR Title Format

Use the same format as commit messages:

```
feat(component): add new app submission form
fix(api): resolve database connection issue
```

### PR Description Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran and how to reproduce them.

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks**: PRs must pass all automated checks
2. **Code Review**: At least one maintainer will review your PR
3. **Testing**: Changes will be tested in a staging environment
4. **Approval**: PRs need approval before merging

## Coding Standards

### JavaScript/React Standards

```javascript
// Use functional components with hooks
function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  // Early returns for better readability
  if (!prop1) {
    return <div>Loading...</div>;
  }

  // Event handlers with descriptive names
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitData();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  return <div className="component-wrapper">{/* JSX content */}</div>;
}

// Default export at bottom
export default MyComponent;
```

### CSS/Tailwind Standards

```jsx
// Use semantic class names with Tailwind
<div className="card bg-white shadow-md rounded-lg p-6">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    Card Title
  </h2>
  <p className="text-gray-600 leading-relaxed">
    Card content goes here.
  </p>
</div>

// Responsive design - mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="card">
      {/* Card content */}
    </div>
  ))}
</div>
```

### API Standards

```javascript
// Standard API endpoint structure
export default async function handler(req, res) {
  try {
    // Method validation
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      });
    }

    // Authentication check
    const userId = req.headers["x-clerk-user-id"];
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    // Input validation
    const validatedData = SomeSchema.parse(req.body);

    // Business logic
    const result = await performOperation(validatedData);

    // Success response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("API Error:", error);

    // Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      });
    }

    // Generic error response
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
```

### Database Standards

```javascript
// Use schema validation
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(120).optional(),
});

// Service pattern for database operations
export class UserService {
  static async create(userData) {
    const validatedData = UserSchema.parse(userData);

    const db = await getDatabase();
    const collection = db.collection("users");

    const user = {
      ...validatedData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(user);
    return user;
  }

  static async findById(id) {
    const db = await getDatabase();
    const collection = db.collection("users");

    return await collection.findOne({
      _id: new ObjectId(id),
    });
  }
}
```

## Project Structure Guidelines

### File Organization

```
src/
├── components/
│   ├── ui/              # Base components (Button, Input, etc.)
│   ├── auth/            # Authentication components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── contexts/            # React contexts
└── assets/              # Images, icons, etc.
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Files**: camelCase (`userService.js`)
- **Directories**: lowercase (`components/`, `utils/`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Functions**: camelCase (`getUserById`)

### Import Organization

```javascript
// External libraries
import React, { useState, useEffect } from "react";
import { useRouter } from "react-router-dom";

// Internal components
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/UserProfile";

// Utilities and services
import { formatDate } from "@/lib/utils";
import { UserService } from "@/lib/services";

// Types (if using TypeScript)
import type { User } from "@/types";
```

## Documentation Standards

### Component Documentation

```jsx
/**
 * UserProfile component displays user information and allows editing
 *
 * @param {Object} props - Component props
 * @param {User} props.user - User object to display
 * @param {boolean} props.editable - Whether profile can be edited
 * @param {Function} props.onUpdate - Callback when profile is updated
 *
 * @example
 * <UserProfile
 *   user={currentUser}
 *   editable={true}
 *   onUpdate={handleUserUpdate}
 * />
 */
function UserProfile({ user, editable = false, onUpdate }) {
  // Component implementation
}
```

### API Documentation

```javascript
/**
 * Submit a new app to the directory
 *
 * @route POST /api/submit-directory
 * @access Private (requires authentication)
 *
 * @param {Object} req.body - App submission data
 * @param {string} req.body.name - App name (required)
 * @param {string} req.body.description - App description (required)
 * @param {string} req.body.website_url - App website URL (required)
 * @param {string[]} req.body.categories - App categories (required)
 *
 * @returns {Object} 200 - App submission successful
 * @returns {Object} 422 - Validation error
 * @returns {Object} 500 - Server error
 */
```

## Testing Guidelines

### Component Testing

```javascript
// tests/components/Button.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant classes correctly", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");
  });
});
```

### API Testing

```javascript
// tests/api/apps.test.js
import { createMocks } from "node-mocks-http";
import handler from "@/api/apps";

describe("/api/apps", () => {
  it("returns apps list successfully", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty("apps");
    expect(Array.isArray(data.apps)).toBe(true);
  });
});
```

## Security Guidelines

### Input Validation

- Always validate user input using Zod schemas
- Sanitize HTML content to prevent XSS
- Use parameterized queries to prevent injection attacks

### Authentication

- Never store sensitive data in localStorage
- Use secure HTTP-only cookies when possible
- Implement proper session management

### API Security

- Validate authentication on all protected endpoints
- Implement rate limiting
- Use HTTPS in production
- Sanitize error messages to avoid information leakage

## Performance Guidelines

### Frontend Performance

- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Minimize bundle size

### Backend Performance

- Implement database indexing
- Use pagination for large datasets
- Cache frequently accessed data
- Monitor API response times

## Getting Help

### Resources

- **Documentation**: Check the `docs/` directory
- **Code Examples**: Look at existing components and API endpoints
- **Community**: Join our discussion forum or Discord
- **Issues**: Search existing issues before creating new ones

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time chat and community support
- **Email**: For sensitive security issues

## Recognition

Contributors who make significant contributions will be:

- Added to the CONTRIBUTORS.md file
- Mentioned in release notes
- Invited to join the core team (for exceptional contributors)

## License

By contributing to DirectoryHunt, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DirectoryHunt! 🚀

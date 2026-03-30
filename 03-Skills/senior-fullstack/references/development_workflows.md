# Development Workflows

## 1. Feature Development Cycle

1. **Plan**: Define data models and API contracts first.
2. **Branch**: Create `feature/name-of-feature` from `develop` (or `main`).
3. **Implement**:
   - Database migrations (if any).
   - Backend logic & Tests.
   - Frontend UI.
4. **Verify**: Run `npm test` and `npm run lint`.
5. **PR**: Open Pull Request. CI must pass.

## 2. CI/CD Pipeline

- **Trigger**: push to `main` or `feature/*`.
- **Jobs**:
  1. **Install**: Cache node_modules.
  2. **Lint**: Check formatting and code style.
  3. **Test**: Run Unit and Integration tests.
  4. **Build**: Verify the application builds without error.
  5. **Deploy**: (On `main` branch only) Push to staging/production.

## 3. Debugging Workflow

- **Backend**: Use `console.log` for quick checks, or attach debugger in VS Code (`Auto Attach: Always`).
- **Frontend**: Use React Developer Tools and Network Tab.
- **Performance**: Use Chrome DevTools "Performance" tab and "Lighthouse".

## 4. Environment Management

- `.env.example`: Committed to repo. Limits structure.
- `.env`: **NEVER** committed. Contains secrets.
- Use `dotenv-safe` or Zod environment validation to ensure all required vars are present at startup.

## 5. Error Handling Strategy

- **Operational Errors**: (Network fail, DB timeout) -> Retry or Fail Gracefully.
- **Programmer Errors**: (Null pointer, Syntax) -> Fix code.
- **Client**: Show user-friendly toast notifications. Log full error to monitoring (Sentry/Datadog).

# Contributing to FactoryFlow

Thank you for contributing to FactoryFlow! Please follow these guidelines to keep our codebase consistent and maintainable.

## 1. Branch Naming Conventions

Use the following format:

`<type>/<short-description>`

| Type | Description | Example |
|---|---|---|
| `feat` | New feature | `feat/orders-page` |
| `fix` | Bug fix | `fix/order-validation` |
| `refactor` | Code refactoring | `refactor/api-client` |
| `docs` | Documentation changes | `docs/readme-update` |
| `test` | Adding or updating tests | `test/orders-api` |
| `chore` | Maintenance and configuration | `chore/eslint-config` |
| `style` | Styling and formatting | `style/orders-layout` |

### Rules

- Use English and lowercase letters.
- Separate words with hyphens (`kebab-case`).
- Keep branch names short and descriptive.
- One branch should represent one task or feature.
- Create new branches from the latest `main`.

## 2. Commit Message Conventions

We follow the **Conventional Commits** specification.

### Format

`<type>(<scope>): <description>`

The scope is optional and identifies the affected module.

### Examples

```bash
git commit -m "feat(orders): add order creation form"
git commit -m "fix(orders): correct status validation"
git commit -m "refactor(api): simplify fetch wrapper"
git commit -m "test(machines): add CRUD tests"
git commit -m "docs: update README"
git commit -m "chore: configure ESLint"
git commit -m "style(schedule): improve timeline layout"
```

### Rules

- Write commit messages in English.
- Use lowercase for the type and scope.
- Start descriptions with an imperative verb (`add`, `fix`, `update`, `remove`).
- Do not end commit messages with a period.
- Keep the subject line under 72 characters when possible.
- Each commit should represent one logical change.
- Avoid vague messages such as `fix stuff`, `updates`, or `changes`.

## 3. Pull Request Guidelines

### Before Creating a Pull Request

- Make sure your branch is up to date with `main`.
- Verify that the application builds successfully.
- Run available tests and lint checks.
- Remove debugging code and unnecessary console logs.
- Review your own changes before submitting.

### Pull Request Requirements

- Use a clear and descriptive title.
- Include instructions for testing.
- Keep each PR focused on a single task.
- Resolve merge conflicts before merging.

### PR Title Example

`feat(orders): implement order management page`

## 4. Development Workflow

### Step 1: Update Main

```bash
git switch main
git pull origin main
```

### Step 2: Create a Branch

```bash
git switch -c feat/machines-page
```

### Step 3: Make Changes and Commit

```bash
git add .
git commit -m "feat(machines): add machines list"
```

### Step 4: Push Your Branch

```bash
git push -u origin feat/machines-page
```

### Step 5: Create a Pull Request

1. Open the repository on GitHub.
2. Create a Pull Request targeting `main`.
3. Fill out the PR template.
4. Request a code review.
5. Address review comments if necessary.
6. Merge after approval.

## 5. Code Quality

- Follow the existing project structure and coding style.
- Use TypeScript types instead of `any` whenever possible.
- Keep functions small and focused.
- Avoid unnecessary dependencies.
- Handle errors appropriately.
- Write readable and maintainable code.
- Add or update tests when applicable.

## 6. General Guidelines

- Do not commit secrets, API keys, or `.env` files containing credentials.
- Do not commit generated files or dependencies such as `node_modules`.
- Communicate significant architectural changes before implementing them.
- Avoid unrelated changes in the same Pull Request.
- Keep the `main` branch stable.

---

By following these guidelines, we can maintain a clean Git history and collaborate efficiently on FactoryFlow.

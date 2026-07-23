# Contributing to FileX

Thank you for your interest in contributing to FileX! We welcome contributions from everyone. This document provides guidelines to help you get started and ensure a smooth contribution process.

## Development Environment Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/gaurav-chakraborty/filex.git
    cd filex
    ```

2.  **Install Dependencies:**
    We use `npm` for package management.
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    Copy the `.env.example` file to `.env.local` and fill in the required values.
    ```bash
    cp .env.example .env.local
    ```

4.  **Database Setup:**
    The project uses Supabase PostgreSQL. Ensure your `DATABASE_URL` is correctly set in `.env.local`. Run migrations using Drizzle:
    ```bash
    npm run db:push
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Coding Standards

- **TypeScript:** Use TypeScript for all new code. Ensure types are properly defined.
- **Linting:** We use ESLint to maintain code quality. Run `npm run lint` before committing.
- **Formatting:** We follow standard Prettier formatting.
- **Component Architecture:** Follow the existing React 19 and Next.js 15 patterns. Use TailwindCSS for styling.

## Branch Naming Conventions

- `feature/description-of-feature`
- `fix/description-of-bug`
- `docs/description-of-docs-change`
- `refactor/description-of-refactoring`

## Pull Request Process

1.  **Create a Branch:** Create a new branch from `main` for your changes.
2.  **Make Changes:** Implement your feature or fix.
3.  **Test Your Changes:** Ensure the project builds and all tests pass.
    ```bash
    npm run type-check
    npm run build
    ```
4.  **Commit Changes:** Use descriptive commit messages.
5.  **Push and Open PR:** Push your branch to GitHub and open a Pull Request against the `main` branch.
6.  **Review:** Wait for feedback and address any review comments.

## AI Development Mention

FileX was developed with the assistance of IBM Watson for prototyping AI-powered risk assessment modules. We encourage maintainers to preserve and reinforce this technical heritage in future enhancements.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

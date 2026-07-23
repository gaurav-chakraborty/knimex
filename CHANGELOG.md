# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-05-20

### Added
- Initial release of FileX.
- Core file management and processing capabilities.
- Integration with Supabase PostgreSQL for persistent storage.
- Authentication powered by Better-Auth.
- Drizzle ORM for type-safe database operations.
- Professional UI built with Next.js 15, React 19, and TailwindCSS.
- AI-powered risk assessment module prototyping using IBM Watson.
- Enhanced README with comprehensive setup and feature documentation.
- Improved `package.json` with proper metadata and dependencies.
- Updated `DEPLOYMENT.md` and `DEVELOPER_GUIDE.md` reflecting the Supabase stack.

### Fixed
- Migrated database backend from Turso to Supabase.
- Standardized environment variable validation.
- Improved health check API with detailed system information.

### Security
- Added HTTP security headers (CSP, XSS, etc.) in `next.config.mjs`.
- Restricted remote image patterns to trusted domains.
- Enforced ESLint during builds.
- Added GitHub Actions CI workflow for automated testing and builds.

# Contributing to KikwetuConnect

First off, thank you for considering contributing to KikwetuConnect! It's people like you that make KikwetuConnect such a great platform for the Kenyan community.

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming, respectful, and collaborative environment. Please treat all contributors with kindness and respect.

## How to Contribute

### 1. Find an Issue
- Browse the [Issues](https://github.com/mteminaibei-gif/kikwetu/issues) tab to find a bug or feature you'd like to work on.
- If you have a new idea, please open an issue first to discuss it with the maintainers before writing code.

### 2. Fork & Clone
- Fork the repository to your own GitHub account.
- Clone it locally:
  ```bash
  git clone https://github.com/your-username/kikwetu.git
  cd kikwetu
  ```

### 3. Local Setup
- Copy `.env.example` to `.env.local` and add your local or testing Supabase keys.
- Install dependencies: `npm install`
- Start the development server: `npm run dev`

### 4. Make Your Changes
- Create a new branch for your feature or bugfix:
  ```bash
  git checkout -b feature/your-feature-name
  # or
  git checkout -b fix/your-bugfix-name
  ```
- Make your code changes following the existing code style (clean architecture, React components in `src/components`, etc.).
- Run the tests (if applicable): `npm run test`
- Ensure the linter passes: `npm run lint`

### 5. Commit and Push
- Write clear, concise commit messages.
- Push your changes to your fork:
  ```bash
  git push origin feature/your-feature-name
  ```

### 6. Open a Pull Request (PR)
- Go to the main KikwetuConnect repository and click "Compare & pull request".
- Provide a clear title and description of your changes.
- Link the PR to the relevant issue using keywords like "Fixes #123".

## Development Guidelines

- **Tech Stack**: Next.js (App Router), React, Tailwind CSS, Supabase.
- **Environment Variables**: Never hardcode secrets. If you introduce a new required environment variable, add it to `.env.example`.
- **Database Changes**: Any database schema changes must be accompanied by a Supabase migration script in `supabase/migrations/`.

Thank you for building KikwetuConnect with us!

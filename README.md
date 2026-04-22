# Indecisive Demo

Indecisive is a role-based AI decision platform for complex organisational problem-solving, now migrated to a Next.js App Router project. This repository contains a frontend-only demo of the system.

The app simulates how Indecisive helps teams submit business problems, pull internal context, generate multiple solution blueprints, surface conflicts, rank options, escalate decisions, and merge compatible strategies at a superior level.

## Demo Scope

This project is intentionally demo-only:

- Jira, Confluence, past decisions, GLM reasoning, and merge synthesis are simulated in local in-memory state.
- Staff users own the submission, conflict review, scoring, and escalation flow.
- Lead, director, and executive users own the merge and unified output review flow.
- Export actions on the output page are safe frontend demos such as copy, download, and print.

## Product Flow

The current demo follows this flow:

1. Landing page with Indecisive value proposition, flow summary, and demo metrics
2. Login page followed by role selection
3. Role-based dashboard
4. Staff submission flow:
   problem submission -> analyzing -> blueprint arena -> conflict review -> scoring -> escalation confirmation
5. Superior review flow:
   dashboard -> merge workspace -> unified strategy output

## Roles

- `staff`: submits problems, reviews generated blueprints, acknowledges conflicts, scores options, and escalates one preferred blueprint
- `lead`: reviews pending escalations, compares merge suggestions, and generates unified strategies
- `director`: same superior review permissions as lead
- `executive`: same superior review permissions as lead, with final output visibility

## Architecture

The demo now runs on:

- Next.js App Router for file-based routing
- React 19 client components for the interactive demo flow
- Tailwind CSS v4 for styling
- Vitest and React Testing Library for route and flow coverage

Route guards still enforce the Indecisive role model, but they now sit inside client-side wrappers used by the App Router pages instead of `react-router-dom`.

## Routing

The demo uses real Next.js routes under `src/app`.

Public routes:

- `/`
- `/login`

Staff routes:

- `/dashboard`
- `/submit`
- `/analyzing`
- `/blueprints`
- `/conflicts`
- `/scoring`
- `/escalated`

Superior routes:

- `/dashboard`
- `/merge`
- `/output`

Route guards redirect users to the latest valid step if they try to open a page that does not match their role or current submission state.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Start the production server after building:

```bash
npm run start
```

Create a production build:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

Set up local environment variables before using live blueprint generation:

- `ZAI_API_KEY`: required primary provider key
- `ZAI_BASE_URL`: optional Z.AI base URL, defaults to `https://api.z.ai/api/paas/v4/`
- `ZAI_MODEL`: optional Z.AI model name, defaults to `glm-5.1`
- `GEMINI_API_KEY`: optional secondary fallback key

Use `.env.example` as the template for your local `.env.local`.

Run tests in watch mode:

```bash
npm run test:watch
```

Lint the project:

```bash
npm run lint
```

## Testing Coverage

The Vitest and React Testing Library suite covers:

- authentication and route guard behavior
- staff happy path from login through escalation
- superior happy path from merge selection through unified strategy output
- flow integrity such as conflict acknowledgement before scoring

## Project Notes

- The demo seeds a small escalation queue so superior views are usable before a new staff submission is created.
- Generated blueprints, retrieved context, merge suggestions, and unified outputs are derived from the active demo state instead of fixed output pages.
- Blueprint ranking is hidden until the scoring stage so the flow matches the intended product behavior.
- Interactive screen components live in `src/views`, while route entries live in `src/app`.

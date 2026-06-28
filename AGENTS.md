# Lord Manor Development Instructions

## Project overview

Lord Manor is a private personal-management application deployed through
Cloudflare Pages.

The application uses:

- Vanilla HTML, CSS, and JavaScript
- Cloudflare Pages Functions
- Cloudflare D1 with the binding name `DB`
- GitHub Actions for syntax checking
- No frontend framework or build system

Do not introduce React, Vue, Angular, Svelte, a bundler, or another
frontend framework without explicit approval. Do not introduce a
production dependency unless it is necessary and explicitly justified.
Development-only test dependencies are permitted.

## Repository rules

- Inspect the current repository before modifying code.
- Work on a separate branch and create a pull request.
- Never commit directly to `main`.
- Do not merge pull requests automatically.
- Implement one clearly scoped feature per pull request.
- Preserve existing behavior unless the task explicitly changes it.
- Do not introduce a framework, bundler, or production dependency
  without explicit approval.
- Do not expose passwords, session secrets, API keys, or Cloudflare
  secrets.
- Never place credentials in repository files.
- Do not weaken production authentication to make testing easier.
- Keep all dialogs outside page elements that may be hidden.
- Continue using ordinary browser scripts rather than ES modules
  unless an explicit migration is approved.
- Prefer small dedicated JavaScript files over expanding `script.js`.
- Load `manor.js` after `departments.js` and before feature scripts.
  It owns the `window.Manor` namespace for cross-feature events, shared
  browser utilities, static configuration, and feature registrations.
- Use `Manor.events` for feature-to-feature refreshes. Mutations should
  emit domain events such as `issue:changed`, `project:changed`,
  `milestone:changed`, or `order:changed`; interested features should
  subscribe instead of calling another feature's global refresh function.
- Keep legacy `window.*` feature refresh shims only as compatibility
  wrappers. New code should register or call feature APIs through
  `Manor.features`.
- Weekly Estate Report refreshes should ignore Order events unless the
  report starts including Orders. Hidden Weekly Report views should not
  fetch solely because another feature changed data.

## Application terminology

- An activity record is called an Issue.
- Projects are governed through the Council Chamber.
- Tasks are called Orders.
- The daily summary is called the Manor Chronicle.
- Department identifiers must remain compatible with
  `departments.js` and the server-side department list.

## Database rules

- Preserve existing D1 data.
- Do not rename or remove columns without an explicit migration plan.
- Put schema changes in a versioned SQL migration file.
- Use parameterized D1 queries.
- Validate all API input on the server.
- Require the existing authenticated session for every private API.
- Require same-origin validation for every write operation.

## Required checks

After modifying browser JavaScript, run:

```bash
node --check manor.js
node --check script.js
node --check estate-office.js
node --check departments.js
node --check treasury.js
node --check chronicle.js
node --check weekly-report.js
```

Also syntax-check all JavaScript files under `functions/` as ES
modules using the repository's existing workflow method.

Run relevant browser tests for user-facing flows. Report exactly which
commands were run, and do not claim that a test passed unless it was
actually executed.

Pull-request descriptions must state:

- What changed
- Which files changed
- Tests run
- Test results
- Any limitations
- Whether a database migration is required

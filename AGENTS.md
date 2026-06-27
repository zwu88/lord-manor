# Lord Manor Development Instructions

## Project overview

Lord Manor is a private personal-management website deployed through
Cloudflare Pages.

The application uses:

- Vanilla HTML, CSS, and JavaScript
- Cloudflare Pages Functions
- Cloudflare D1 with the binding name `DB`
- GitHub Actions for syntax checking
- No frontend framework or build system

## Repository rules

- Inspect the current repository before modifying code.
- Work on a separate branch and create a pull request.
- Never commit directly to `main`.
- Implement one clearly scoped feature per pull request.
- Preserve existing behavior unless the task explicitly changes it.
- Do not introduce a framework, bundler, or production dependency
  without explicit approval.
- Do not modify or expose Cloudflare secrets.
- Never place credentials or API keys in repository files.
- Keep all dialogs outside page elements that may be hidden.
- Continue using ordinary browser scripts rather than ES modules
  unless an explicit migration is approved.
- Prefer small dedicated JavaScript files over expanding `script.js`.

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
node --check script.js
node --check estate-office.js
node --check departments.js
node --check treasury.js
node --check chronicle.js

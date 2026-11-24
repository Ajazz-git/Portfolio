# Renewal Desk: Publication Checklist

This checklist separates publishing the product story from making the working application accessible to the public.

## A. Before the product page is public

- [ ] Review employment agreement and any intellectual-property, confidentiality and outside-work provisions.
- [ ] Confirm the personal project contains no employer source code, business data, internal documents, proprietary designs, secrets or copied configurations.
- [ ] Keep the application source repository private.
- [ ] Keep detailed product briefs, architecture records and internal implementation notes private.
- [ ] Use only fictional sample data in screenshots and demos.
- [ ] Label dated screenshots as illustrative captures, not current customer data.
- [ ] Check wording and feature claims against the working product before publishing.

## B. Before a hosted demo is public

- [ ] Deploy only the dedicated demo configuration, not a production configuration or real customer database.
- [ ] Confirm demo mode is enabled and the demo database contains only fictional seed data.
- [ ] Confirm the demo reset works and cannot wipe any non-demo database.
- [ ] Confirm real SMTP delivery is disabled or forced into a mail sink.
- [ ] Confirm outbound webhooks are disabled.
- [ ] Confirm password changes and first-run setup are disabled in demo mode, as intended.
- [ ] Confirm the demo has no private files, environment values, logs or internal endpoints exposed.
- [ ] Verify access controls and visitor permissions.
- [ ] Test the application from an external network and on a mobile device.
- [ ] Check health, container restarts, logs and resource limits.
- [ ] Record the verified public URL and add it to the portfolio page only after the checks pass.

## C. Before a dedicated public showcase repository is created

- [ ] Choose the final repository name (suggested: `renewal-desk-showcase`).
- [ ] Confirm the repository contains only README, case study, approved screenshots and other public marketing material.
- [ ] Do not copy application source, migrations, environment files, internal product briefs or deployment secrets.
- [ ] Add a clear notice that the application source is private and no source-code licence is being offered.
- [ ] Check all screenshots and links from a logged-out browser session.
- [ ] Link to the public product page, not to the private application repository.

## D. Final publication checks

- [ ] Review the product page on desktop and mobile.
- [ ] Check page title, description, canonical URL and social preview.
- [ ] Verify all screenshot paths and image alt text.
- [ ] Check spelling, product terminology and claims.
- [ ] Confirm the public demo link works, if supplied.
- [ ] Update resume and GitHub profile only after the product page is live.

## Current publication status

- Portfolio case-study page: prepared on a feature branch.
- Product screenshots: selected, marked as fictional demo captures dated 12 November 2026.
- Public hosted demo: not yet verified.
- Dedicated `renewal-desk-showcase` repository: optional follow-on. The current public materials are grouped under the portfolio repository.
- Application source: remains private.

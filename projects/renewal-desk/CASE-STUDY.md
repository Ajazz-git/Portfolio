# Renewal Desk: Product Case Study

## Summary

Renewal Desk is an independent product initiative focused on subscription and software-licence renewal decisions. The central premise is simple: the most important date is often not the renewal date, but the last day on which the organisation can cancel or change the subscription.

The product is a working application under active development. Its application source code remains private.

## Problem framing

Many teams maintain subscriptions in spreadsheets or simple reminder tools. These approaches can record dates, but the renewal process also depends on people:

- Someone must own the decision.
- The owner must confirm whether the subscription is still needed.
- A non-response must remain visible and trigger follow-up.
- The organisation needs time to cancel, renegotiate or replace a service before its notice period ends.
- The reasoning and decision should be traceable later.

The product therefore focuses on closing the decision loop, rather than only sending a notification.

## Product approach

### 1. Make the decision deadline central

The workflow derives a decision date from the renewal date and notice period. This is the point by which a cancellation or change decision must be made.

### 2. Ask the owner early

An owner confirmation asks whether the subscription is still needed. The owner can answer without needing a full application account.

### 3. Keep following up

Unanswered requests remain open and visible. The workflow can remind and escalate. Silence is not generally treated as consent.

### 4. Handle the last call deliberately

Near the decision date, the product highlights the outstanding decision. An earlier explicit confirmation is treated differently from a subscription for which nobody has responded.

### 5. Keep the renewal cycle explainable

The product records owner responses, decisions and approval activity so teams can see what happened and when.

## Product surface

The working product includes:

- Today's Desk: an attention-focused view of decisions needing action.
- Registry: subscription and vendor records.
- Subscription detail: key dates, owners, planned reminders and history.
- Runway: a 12-month view of upcoming owner prompts, decision dates and renewals.
- Reports: upcoming renewals, financial exposure and CSV export.
- People and ownership management.
- Approval status and decision history.
- Calendar feed and integration capabilities.

## My contribution

I independently initiated Renewal Desk as a personal product initiative. My responsibilities include:

- Identifying and framing the product problem.
- Defining the product concept, requirements and user workflows.
- Shaping the confirmation, follow-up and deadline-protection model.
- Defining the staged scope and priorities.
- Making architecture and technology decisions.
- Directing AI-assisted implementation.
- Reviewing changes and validating product behaviour.

This is not a claim that every line of code was written manually. AI-assisted development is part of the build process; product direction, review and validation remain my responsibility.

## Technology

- Next.js and React for the web application.
- TypeScript for application and domain logic.
- PostgreSQL for persistence.
- Drizzle ORM for database access and migrations.
- Docker and Docker Compose for packaging and local deployment.

## Current state

The application is working and continues to evolve. The existing repository includes a fictional-data demo mode and interface screenshots. A public hosted demo is a separate publication step and should not be considered available until deployment and safety checks have been completed.

## Product and source separation

The public portfolio shares the product problem, workflow, selected capabilities and illustrative screenshots. The application source, detailed product decisions, operational configuration and deeper implementation documentation remain private while the product is developed as a potential commercial offering.

## What comes next

- Complete a public-demo safety review.
- Deploy a controlled demo with fictional data only.
- Test external access, reset behaviour and disabled outbound integrations.
- Publish the public product page and link the verified demo.
- Continue product development separately from the public showcase.

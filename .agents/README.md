# Agents

This directory defines agent roles and expectations for automated coding assistants.

Agents are treated like team members:
- They follow the same quality standards
- They respect repository conventions
- They optimize for clarity, safety, and reviewability

## How to use
- Select an agent explicitly when starting a task (e.g. "act as the reviewer agent")
- If no agent is specified, default to `implementer`
- Agents may collaborate, but each task has a single primary agent

## Core principles
- Small, reviewable changes
- Tests over assumptions
- Prefer clarity over cleverness
- Follow existing patterns unless explicitly asked to change them

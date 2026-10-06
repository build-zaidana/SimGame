---
id: code-review
title: Code Review & Pull Requests
mode: dev
order: 3
sources:
  - 'Google Engineering Practices — How to do a code review'
  - 'OWASP — Secrets Management Cheat Sheet'
---

On a developer team, new code is sent as a **pull request (PR)**: a proposed change that teammates read before it joins the main app. Lines starting with **+** are added, lines with **−** are removed.

When **reviewing**, ask:

1. **Is it right?** Does the logic match the goal, including boundaries (`>` vs `>=`) and edge cases?
2. **Is it readable?** Are the variable names clear?
3. **Is it safe?** Is there a **secret** (password, API key) written straight into the code? Secrets in code can be read by anyone with access to the repository, so they belong in secret settings.

Your decisions:

- **Approve** when the code is good. Holding back correct code slows the team down.
- **Revise** when there is a problem. Mark the problem line so the author knows what to fix.
- **Escalate** when it needs special permission or expertise.

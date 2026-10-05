---
id: secure-coding
title: Writing Secure Code
mode: dev
order: 7
sources:
  - 'OWASP — Top 10 (Injection, Logging)'
  - 'OWASP — Input Validation Cheat Sheet'
---

Correct code isn't always **safe**. A few key habits:

- **Check input**. Data from users can be mistyped or deliberately odd. Check its type and range, for example a quantity must be a number from 1 to 100.
- **Keep secrets**. Passwords, tokens, and personal data must never be written in code or printed to logs.
- **Official libraries**. Use libraries from the company's official sources. Code pasted from forums can carry bugs or harmful extras.
- **Watch for strange changes**. A PR from an unknown account, or code that quietly sends data to an outside address, is a red flag. Don't approve or fix it yourself: **escalate to the SOC team** so it gets investigated.

Secure code isn't about being paranoid; it's small habits done every day.

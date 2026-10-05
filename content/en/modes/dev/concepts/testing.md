---
id: testing
title: Writing Useful Tests
mode: dev
order: 6
sources:
  - 'Python Software Foundation — unittest (concepts)'
  - 'Martin Fowler — Test Pyramid'
---

A good test proves the code is right, **even in odd situations**. Think about **edge cases**:

- An **empty** list `[]` or empty text `""`.
- **Zero** and **negative** numbers.
- **Capital letters** and spaces at the start or end of text.
- Rule boundaries, for example exactly 17 years old.

A test that **always passes**, like `assert True` or comparing something with itself, tests nothing. It only gives a false sense of safety.

When you fix a bug, add a **regression test**: a test that fails if the same bug ever comes back.

In a review, new logic without relevant tests should get a **Revise** decision. Ask the author to add tests, especially for edge cases.

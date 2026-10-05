---
id: reading-errors
title: Tests & Error Messages
mode: dev
order: 2
sources:
  - 'Python Software Foundation — Errors and Exceptions'
  - 'Python Software Foundation — The assert statement'
---

A **test** checks whether code behaves as promised. In this game, tests are written with `assert`:

```python
assert average([80, 90, 100]) == 90
```

If the result is different, the test **fails**. Developers work in a loop: run the tests → read the failure → fix one thing → run again.

There are also **hidden tests** for **edge cases**: an empty list, capital letters, zero. Think about those before submitting.

When code crashes, Python shows a **traceback**. Read it from the **last line**:

- `NameError`: a variable or function name is misspelled or not created yet.
- `TypeError`: the data types don't match, for example text + number.
- `IndentationError`/`SyntaxError`: the code breaks the writing rules, for example a missing `:` or messy indentation.

The line number in the traceback shows where the problem happened.

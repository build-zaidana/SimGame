---
id: debugging
title: 'Debugging: Hunting Bugs'
mode: dev
order: 4
sources:
  - 'Python Software Foundation — Errors and Exceptions'
  - 'Python Software Foundation — The Python Tutorial'
---

**Debugging** means finding out why code doesn't behave as expected.

The steps:

1. **Reproduce the bug** with a small example. For instance, call the function with a list of just two numbers.
2. **Look inside**. Add `print()` to show a variable's value in the middle of a loop, then compare it with what you expected.
3. **Read the error from the bottom**. `IndexError` means reading a position that isn't in the list. `KeyError` means that key isn't in the dictionary (dict).
4. **Fix one thing**, then run the tests again.

Bugs show up most often at the **boundaries**. `range(5)` gives 0 to 4, not 5. List positions start at 0, so the last item is at `items[len(items) - 1]`.

Remember to remove trial `print()` calls before submitting.

---
id: python-basics
title: Python Basics for New Developers
mode: dev
order: 1
sources:
  - 'Python Software Foundation — The Python Tutorial'
  - 'MicroPython Documentation — Differences from CPython'
---

**Python** is a programming language that is easy to read. A few key ideas:

- **Variables** store values: `total = 0`.
- **Functions** are recipes you can call again. They are written with `def` and give back a result with `return`.
- **Indentation** (4 spaces) marks the body of a block after `if`, `for`, or `def`. Wrong indentation = wrong code.
- **Data types**: numbers (`5000`) and text (`"Rp"`) are different. To join them, turn the number into text first: `"Rp " + str(5000)`.
- **Loops** `for x in items:` do something for every item in a list. `len(items)` tells you how many items there are.

Example:

```python
def average(scores):
    return sum(scores) / len(scores)
```

Watch the **boundary**: `age > 17` does not include 17, while `age >= 17` does.

The Python in this game is **MicroPython**, a compact version that runs in the browser. Almost all Python basics work.

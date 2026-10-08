---
id: data-quality
title: 'Dirty Data and How to Clean It'
mode: data
order: 5
sources:
  - 'DAMA International — DAMA-DMBOK: Data Management Body of Knowledge (2nd ed.)'
  - 'SQLite Documentation — NULL Handling'
---

Data from forms, cash registers or imported files is often **dirty**. Analysis on dirty data gives wrong conclusions, so clean it first.

The three most common problems:

1. **Duplicate rows**: someone who pressed submit twice is recorded twice. Donation totals get inflated. Find them with `GROUP BY email HAVING COUNT(*) > 1`.
2. **Empty values (NULL)**: NULL means "unknown", not zero. Find it with `WHERE email IS NULL`. Writing `= NULL` never finds anything.
3. **Impossible values**: an age of 230 or 31 February is surely a typo. Filter or fix them first, e.g. `WHERE age > 0 AND age < 120`.

`SELECT DISTINCT city` shows each value only once, handy for spotting different spellings ("Bdg" and "Bandung").

Clean, consistent data can be used right away.

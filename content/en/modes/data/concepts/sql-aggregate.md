---
id: sql-aggregate
title: 'Summarising Data: COUNT, SUM, AVG, GROUP BY'
mode: data
order: 3
sources:
  - 'SQLite Documentation — Aggregate Functions'
  - 'SQLite Documentation — SELECT (GROUP BY, HAVING)'
---

Meetings rarely need data row by row. They usually ask for the **summary**: how many orders, what total, what average.

- `COUNT(*)` counts rows.
- `SUM(total)` adds up a column.
- `AVG(total)` takes the average.

For a summary **per group**, use `GROUP BY`:

```sql
SELECT branch, COUNT(*)
FROM orders
GROUP BY branch;
```

You get one row per branch. To filter grouped results, use `HAVING` after `GROUP BY`, e.g. `HAVING COUNT(*) > 2`. `WHERE` filters rows _before_ grouping, so it cannot use `COUNT` or `SUM`.

Do not hard-code numbers like `SUM(total) / 5`. Today the data has 5 rows, tomorrow it may have 50. Let SQL do the maths, for example with `AVG()`.

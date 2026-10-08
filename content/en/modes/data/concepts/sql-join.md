---
id: sql-join
title: 'Combining Tables with JOIN'
mode: data
order: 6
sources:
  - 'SQLite Documentation — SELECT (join-clause)'
---

Tidy data is often split across several tables. Example: the `customers` table holds names and cities, while `orders` only stores `customer_id`. To show who placed an order, combine them with **JOIN**:

```sql
SELECT customers.name, orders.total
FROM orders
JOIN customers ON orders.customer_id = customers.id;
```

- `ON` says which columns **belong together**. Here `customer_id` in orders points to `id` in customers.
- Put the table name before a column (`orders.id`) when the column name exists in both tables.
- Pairing the wrong columns (e.g. `orders.id = customers.id`) still returns data, but the **people get mixed up**. That is why query results must be checked.

JOIN can be combined with `GROUP BY`, e.g. total spending per city.

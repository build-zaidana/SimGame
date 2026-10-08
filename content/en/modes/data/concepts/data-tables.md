---
id: data-tables
title: 'Tables, Rows and SELECT'
mode: data
order: 1
sources:
  - 'SQLite Documentation — SELECT (sqlite.org/lang_select.html)'
---

Office data is usually stored in **tables**: each **row** is one thing (e.g. one customer), each **column** is one detail (name, city, age).

**SQL** (_Structured Query Language_) is the language for asking a database questions. The basic shape:

```sql
SELECT name, city
FROM customers
WHERE city = 'Bandung';
```

- `SELECT` picks columns. `*` means every column.
- `FROM` names the table.
- `WHERE` filters rows. Text goes in single quotes, numbers do not.
- `AND` / `OR` combine several conditions.
- `ORDER BY points DESC` sorts largest first, `LIMIT 3` keeps the top 3 rows.

Watch the **boundary**: "at least 120" means `>= 120`. With `> 120`, a customer with exactly 120 points is left out.

In this game you write real SQL for **SQLite**, a small database that also runs inside many phone apps.

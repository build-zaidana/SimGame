---
id: log-reading
title: Reading Login Logs
mode: soc
order: 5
sources:
  - 'NIST SP 800-92 — Guide to Computer Security Log Management'
  - 'OWASP — Logging Cheat Sheet'
  - 'BSSN — Information Security Guide for the Public'
---

A **log** is an automatic record of events in a system: who logged in, when, from where (the **IP** address, the network address of a device), on which device, and whether it worked or failed.

Patterns to be suspicious of:

1. **Brute force**: many failed logins from one IP in a short time, a sign that someone is guessing the password. If one finally **succeeds**, the account has probably been broken into.
2. **_Impossible travel_**: a login from Jakarta, then 10 minutes later from another country. Nobody can travel that fast.
3. **Unusual hours**: a login at 3 a.m. from a new device, even though the account owner works from morning to afternoon.

One log line is rarely enough. Compare several lines, then match them with other info like attendance records, business trips, or employee reports. The **Log Filter** tool helps sum up logins per IP.

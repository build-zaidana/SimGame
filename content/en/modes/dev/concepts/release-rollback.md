---
id: release-rollback
title: Releases, Commits, and Rollback
mode: dev
order: 5
sources:
  - 'Git Documentation — git-revert'
  - 'Site Reliability Engineering (O’Reilly) — Release Engineering'
---

Approved code joins the main repository as a **commit**: a record of the change with a message, for example _"Fix discount rounding"_. The commit history tells the team who changed what and why.

A **release** (deploy) is when new code is put into **production**, the app that real users use.

If error numbers jump or an important feature breaks after a release, the first step is a **rollback**: going back to the last healthy version. The fix is worked on afterwards, calmly, not rushed in front of annoyed users.

But compare the numbers first. If the errors were already there **before** the release, or the numbers are normal, that release isn't the cause. Rolling back a healthy release just undoes good work.

Big changes are best released **gradually**, for example to 10% of users first, while being watched.

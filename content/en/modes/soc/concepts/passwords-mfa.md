---
id: passwords-mfa
title: Passwords, OTP, and MFA
mode: soc
order: 3
sources:
  - 'NIST SP 800-63B — Digital Identity Guidelines: Authentication and Lifecycle Management'
  - 'BSSN — Information Security Guide for the Public'
  - 'OWASP — Authentication Cheat Sheet'
---

A strong **password** is **long**, not complicated. A phrase like `kopi-hujan-sepeda-pagi` is harder to guess than `P@ssw0rd!`. Don't use the same password on many sites: if one leaks, they all open up. A **password manager** helps you store them all safely.

**MFA** (_multi-factor authentication_) means logging in needs two proofs: something you know (your password) and something you have (your phone). An **OTP** code (_one-time password_, a code you use only once) sent to your phone is one example.

The golden rule: **never share your OTP** with anyone. Real IT staff, banks, or couriers will never ask for it. Anyone who has your password and your OTP can log in as you.

If you already shared an OTP, or you see a strange login on your account: **reset your password** right away, sign your account out of other devices, then report it to the security team.

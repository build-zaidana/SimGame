---
id: url-anatomy
title: Reading Web Addresses (URLs)
mode: soc
order: 1
sources:
  - 'BSSN — Information Security Guide for the Public'
  - 'APWG — Phishing Activity Trends Report'
  - 'OWASP — Glossary'
---

A **URL** is the address of a web page. Example:

`https://login.nusantarabank.test/masuk`

- `https://` = how the browser connects. The **S** means the connection is encrypted (scrambled), so other people on the network can't peek at it.
- `login.nusantarabank.test` = the **domain**, the name of the site.
- `/masuk` = the **path**, a page inside that site.

To find the site's owner, read the domain **from right to left**: skip endings like `.test`, `.co.id`, or `.com`, then take the one name before it. In the example, the owner is `nusantarabank`. The word `login.` in front is just a **subdomain** that the owner created.

Scammers like to put a bank's name at the front: `nusantarabank.akun-aman.test`. Read from the right: the owner is `akun-aman`, not the bank!

Also remember: the **HTTPS** padlock only means the connection is encrypted. Scam sites can have a padlock too.

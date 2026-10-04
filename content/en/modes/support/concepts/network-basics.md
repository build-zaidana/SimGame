---
id: network-basics
title: Network Basics (IP, DNS, Ping)
mode: support
order: 4
sources:
  - 'CompTIA Network+ — Network Troubleshooting Methodology'
  - 'IETF RFC 3927 — Dynamic Configuration of IPv4 Link-Local Addresses'
---

To get online, a computer needs:

- An **IP address**: the computer's "home address" on the network, usually handed out automatically by the router via **DHCP**. If the address is **169.254.x.x**, the computer failed to get an address from the router.
- A **gateway**: the router, the exit door to the internet.
- **DNS**: the "phone book" that turns website names into IP addresses.

**Ping** sends a small message to an address and waits for a reply. If a reply comes back, the path is connected.

Check **from near to far**:

1. Is the cable plugged in? Is Wi-Fi on?
2. Is there a correct IP address?
3. Can it ping the router?
4. Can it ping an IP address on the internet?
5. Do website names open? If pinging an IP works but names fail, the problem is **DNS**.

If one person is offline, check their device. If a **whole floor** drops at once, the problem is in the central network: escalate to the network team.

---
id: network-basics
title: Dasar Jaringan (IP, DNS, Ping)
mode: support
order: 4
sources:
  - 'CompTIA Network+ — Network Troubleshooting Methodology'
  - 'IETF RFC 3927 — Dynamic Configuration of IPv4 Link-Local Addresses'
---

Supaya bisa internetan, komputer butuh:

- **Alamat IP**: "alamat rumah" komputer di jaringan, biasanya diberikan otomatis oleh router lewat **DHCP**. Kalau alamatnya **169.254.x.x**, artinya komputer gagal mendapat alamat dari router.
- **Gateway**: router, pintu keluar ke internet.
- **DNS**: "buku telepon" yang menerjemahkan nama situs menjadi alamat IP.

**Ping** mengirim pesan kecil ke suatu alamat dan menunggu balasan. Kalau ada balasan, jalurnya tersambung.

Periksa **dari dekat ke jauh**:

1. Kabel tercolok? Wi-Fi menyala?
2. Dapat alamat IP yang benar?
3. Bisa ping router?
4. Bisa ping alamat IP di internet?
5. Nama situs bisa dibuka? Kalau ping IP berhasil tapi nama situs gagal, masalahnya di **DNS**.

Kalau satu orang yang putus, periksa perangkatnya. Kalau **satu lantai** putus bersamaan, masalahnya di jaringan pusat: eskalasi ke tim jaringan.

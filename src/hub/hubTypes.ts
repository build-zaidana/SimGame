/** Kontrak antara UI React dan kantor Phaser (tanpa import Phaser, aman untuk bundle awal). */
export interface HubCallbacks {
  /** Pemain masuk/keluar zona interaksi (null = tidak di zona mana pun). */
  onNear(hotspotId: string | null): void;
  /** Pemain berinteraksi (E/Enter/Spasi, atau mengetuk objek lalu sampai di sana). */
  onInteract(hotspotId: string): void;
}

export interface HubOptions {
  /** Mode yang mejanya menyala (yang lain tergambar terkunci). */
  activeModes: string[];
  callbacks: HubCallbacks;
}

export interface HubHandle {
  /** Berinteraksi dengan hotspot tempat pemain berdiri (dipakai tombol di UI React). */
  interact(): void;
  destroy(): void;
}

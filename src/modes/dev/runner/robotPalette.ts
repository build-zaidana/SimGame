/**
 * Palet perintah robot per level: level awal hanya menampilkan perintah dasar, lalu perulangan dan
 * sensor muncul bertahap. Kunci tidak bergantung bahasa; teks tombolnya ada di i18n. Pemain tetap
 * boleh mengetik apa pun; palet hanya bantuan mengetik di HP.
 */
export const ROBOT_COMMANDS = [
  'forward',
  'turn_left',
  'turn_right',
  'pick_up',
  'deliver',
  'for_range',
  'while_target',
  'while_front',
  'if_front',
  'if_package',
  'else',
] as const;
export type RobotCommand = (typeof ROBOT_COMMANDS)[number];

/** Cara mengenali pemakaian tiap perintah di kode (nama Indonesia & Inggris). */
const USES: Record<RobotCommand, RegExp> = {
  forward: /\b(maju|forward)\(/,
  turn_left: /\b(belok_kiri|turn_left)\(/,
  turn_right: /\b(belok_kanan|turn_right)\(/,
  pick_up: /\b(ambil|pick_up)\(/,
  deliver: /\b(antar|deliver)\(/,
  for_range: /\bfor\b/,
  while_target: /\bwhile\s+not\s+(di_tujuan|at_target)\(/,
  while_front: /\bwhile\s+(not\s+)?(depan_kosong|front_clear)\(/,
  if_front: /\bif\s+(not\s+)?(depan_kosong|front_clear)\(/,
  if_package: /\bif\s+(not\s+)?(ada_paket|has_package)\(/,
  else: /\belse\s*:/,
};

/** Perintah yang tampil untuk sebuah level (urutan baku); tanpa batas = semua. */
export function paletteFor(allowed: readonly RobotCommand[] | undefined): readonly RobotCommand[] {
  return allowed ? ROBOT_COMMANDS.filter((c) => allowed.includes(c)) : ROBOT_COMMANDS;
}

/** Perintah yang dipakai solusi acuan tapi tidak ada di palet level itu (dicek content:check). */
export function missingCommands(
  solution: string,
  allowed: readonly RobotCommand[] | undefined,
): RobotCommand[] {
  if (!allowed) return [];
  return ROBOT_COMMANDS.filter((c) => !allowed.includes(c) && USES[c].test(solution));
}

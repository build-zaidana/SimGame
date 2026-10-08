import { describe, expect, it } from 'vitest';
import { ROBOT_COMMANDS, missingCommands, paletteFor } from '../robotPalette.ts';

describe('robot command palette per level', () => {
  it('shows every command when a level does not limit them', () => {
    expect(paletteFor(undefined)).toEqual(ROBOT_COMMANDS);
  });

  it('keeps the palette in the canonical order, whatever order the content lists', () => {
    expect(paletteFor(['deliver', 'forward', 'pick_up'])).toEqual([
      'forward',
      'pick_up',
      'deliver',
    ]);
  });

  it('finds commands the reference solution uses but the palette lacks (Indonesian or English)', () => {
    const basic = ['forward', 'turn_left', 'turn_right', 'pick_up', 'deliver'] as const;
    expect(missingCommands('maju()\nambil()\nantar()\n', [...basic])).toEqual([]);
    expect(
      missingCommands(
        'while not at_target():\n    if has_package():\n        pick_up()\n    forward()\ndeliver()\n',
        [...basic],
      ),
    ).toEqual(['while_target', 'if_package']);
    expect(
      missingCommands(
        'while depan_kosong():\n    maju()\nif not depan_kosong():\n    belok_kiri()\nelse:\n    maju()\n',
        ['forward', 'turn_left'],
      ),
    ).toEqual(['while_front', 'if_front', 'else']);
    expect(missingCommands('for i in range(6):\n    forward()\n', ['forward'])).toEqual([
      'for_range',
    ]);
  });

  it('never complains about an unlimited palette', () => {
    expect(missingCommands('for i in range(2):\n    maju()\n', undefined)).toEqual([]);
  });
});

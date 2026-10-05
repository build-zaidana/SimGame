/** ID alat Meja Developer yang mekaniknya ada di kode (panel intel). Tanpa React. */
export const DEV_TOOLS = {
  testRunner: 'test-runner',
  linter: 'linter',
} as const;

export const DEV_TOOL_IDS: string[] = Object.values(DEV_TOOLS);

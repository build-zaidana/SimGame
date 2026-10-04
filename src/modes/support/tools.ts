/** ID alat Bengkel IT yang mekaniknya ada di kode (panel intel). Tanpa React. */
export const SUPPORT_TOOLS = {
  ping: 'ping-tool',
  scanner: 'hw-scanner',
} as const;

export const SUPPORT_TOOL_IDS: string[] = Object.values(SUPPORT_TOOLS);

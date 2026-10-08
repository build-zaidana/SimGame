/** ID alat Meja Data yang mekaniknya ada di kode (panel intel). Tanpa React. */
export const DATA_TOOLS = {
  profiler: 'data-profiler',
  sourceCheck: 'source-check',
} as const;

export const DATA_TOOL_IDS: string[] = Object.values(DATA_TOOLS);

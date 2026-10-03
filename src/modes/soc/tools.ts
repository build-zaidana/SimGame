/** ID alat SOC yang mekaniknya ada di kode (lihat Document tiap tipe kasus). Tanpa React. */
export const SOC_TOOLS = {
  linkChecker: 'link-checker',
  whois: 'whois',
  sandbox: 'sandbox',
  logFilter: 'log-filter',
} as const;

export const SOC_TOOL_IDS: string[] = Object.values(SOC_TOOLS);

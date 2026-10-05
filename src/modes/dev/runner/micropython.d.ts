/** Tipe minimal untuk paket MicroPython WebAssembly (paketnya tidak menyertakan .d.ts). */
declare module '@micropython/micropython-webassembly-pyscript' {
  export interface MicroPythonOptions {
    /** Lokasi micropython.wasm (di browser: URL aset hasil build). */
    url?: string;
    heapsize?: number;
    pystack?: number;
    linebuffer?: boolean;
    stdout?: (line: string) => void;
    stderr?: (line: string) => void;
  }
  export interface MicroPython {
    runPython(code: string): unknown;
  }
  export function loadMicroPython(options?: MicroPythonOptions): Promise<MicroPython>;
}

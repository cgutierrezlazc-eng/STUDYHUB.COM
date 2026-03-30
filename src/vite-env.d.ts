/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    selectFiles: () => Promise<string[]>
    readFile: (path: string) => Promise<ArrayBuffer>
    getAppPath: () => Promise<string>
  }
}

export interface MemoryStats {
  freeBytes: number
  usedBytes: number
  totalBytes: number
}

export interface CpuStats {
  name: string
  coresCount: number
  load: number[]
}

export interface SystemStats {
  timestamp: string
  temperature: number
  memory: MemoryStats
  cpu: CpuStats
}

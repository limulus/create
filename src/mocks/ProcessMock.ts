import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { vi, type Mock } from 'vitest'

export default class ProcessMock extends EventEmitter {
  readonly argv: string[]
  readonly env: { [k: string]: string }
  readonly stdin: PassThrough
  readonly stdout: PassThrough
  readonly stderr: PassThrough
  exit: Mock<(code?: number) => void>

  constructor(argv: string[]) {
    super()
    this.argv = ['node', 'script.js', ...argv]
    this.env = {}
    this.stdin = new PassThrough()
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
    this.exit = vi.fn((code = 0) => {
      this.stdin.end()
      this.stdout.end()
      this.stderr.end()
      this.emit('exit', code)
    })
  }

  cwd(): string {
    return process.cwd()
  }
}

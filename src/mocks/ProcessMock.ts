/* eslint-disable @typescript-eslint/no-empty-function */

import { jest } from '@jest/globals'
import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

export default class ProcessMock extends EventEmitter {
  readonly argv: string[]
  readonly env: { [k: string]: string }
  readonly stdin: PassThrough
  readonly stdout: PassThrough
  readonly stderr: PassThrough
  exit: ReturnType<typeof jest.fn>

  constructor(argv: string[]) {
    super()
    this.argv = ['node', 'script.js', ...argv]
    this.env = {}
    this.stdin = new PassThrough()
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
    this.exit = jest.fn().mockImplementation((code = 0) => {
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

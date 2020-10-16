/* eslint-disable @typescript-eslint/no-empty-function */

import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

export default class ProcessMock extends EventEmitter {
  readonly argv: string[]
  readonly env: { [k: string]: string }
  readonly stdin
  readonly stdout
  readonly stderr

  constructor (argv: string[]) {
    super()
    this.argv = ['node', 'script.js', ...argv]
    this.env = {}
    this.stdin = new PassThrough()
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
  }

  exit (_code: number): void {}
  cwd (): string { return process.cwd() }
}

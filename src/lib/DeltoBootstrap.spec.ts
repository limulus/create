import fs from 'node:fs'
import path from 'node:path'
import { temporaryDirectory } from 'tempy'
import { describe, it, expect, beforeEach } from 'vitest'

import DeltoBootstrap, { bootstrapCommand } from './DeltoBootstrap.ts'

// The specs stand node in for npx, so they neither reach the network nor need npx.
const node = (script: string) => new DeltoBootstrap(process.execPath, ['-e', script])

describe('DeltoBootstrap', () => {
  describe('by default', () => {
    it('should run delto 1 bootstrap through npx without stopping to ask', () => {
      const bootstrap = new DeltoBootstrap()
      expect([bootstrap.command, ...bootstrap.args]).toEqual([
        'npx',
        '--yes',
        '@limulus/delto@1',
        'bootstrap',
      ])
    })

    it('should match the command a user is told to run by hand, less --yes', () => {
      const bootstrap = new DeltoBootstrap()
      const args = bootstrap.args.filter((arg) => arg !== '--yes')
      expect([bootstrap.command, ...args].join(' ')).toBe(bootstrapCommand)
    })
  })

  describe('.run()', () => {
    let directory: string

    beforeEach(() => {
      directory = temporaryDirectory()
    })

    describe('when the command succeeds', () => {
      it('should run it in the given directory and report success', async () => {
        const result = await node("require('fs').writeFileSync('ran', '')").run(directory)
        expect(result).toEqual({ outcome: 'created' })
        expect(fs.existsSync(path.join(directory, 'ran'))).toBe(true)
      })
    })

    describe('when the command fails with output on stderr', () => {
      it('should give the first line of that output as the reason', async () => {
        const result = await node(
          "console.error('\\n  npm error code ECONNREFUSED\\nnpm error more'); process.exit(1)"
        ).run(directory)
        expect(result).toEqual({ outcome: 'failed', reason: 'npm error code ECONNREFUSED' })
      })
    })

    describe('when the command fails silently', () => {
      it('should give the first line of the failure as the reason', async () => {
        const result = await node('process.exit(3)').run(directory)
        expect(result).toEqual({
          outcome: 'failed',
          reason: expect.stringMatching(/^Command failed: /),
        })
      })
    })

    describe('when the directory already has a BACKLOG.md', () => {
      it('should leave the directory alone without running the command', async () => {
        fs.writeFileSync(path.join(directory, 'BACKLOG.md'), 'theirs')
        const result = await node("require('fs').writeFileSync('ran', '')").run(directory)
        expect(result).toEqual({ outcome: 'existing' })
        expect(fs.existsSync(path.join(directory, 'ran'))).toBe(false)
        expect(fs.readFileSync(path.join(directory, 'BACKLOG.md'), 'utf8')).toBe('theirs')
      })
    })

    describe('when the command cannot be found', () => {
      it('should give the spawn error as the reason', async () => {
        const result = await new DeltoBootstrap('cTZ-no-such-command', []).run(directory)
        expect(result).toEqual({
          outcome: 'failed',
          reason: expect.stringContaining('ENOENT'),
        })
      })
    })
  })
})

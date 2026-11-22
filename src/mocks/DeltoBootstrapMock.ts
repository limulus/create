import { vi } from 'vitest'

import DeltoBootstrap, { type BootstrapResult } from '../lib/DeltoBootstrap.ts'

// Stands in for the real bootstrap, which would reach the npm registry through npx.
const prototype = {
  run: vi.fn(async (): Promise<BootstrapResult> => ({ outcome: 'created' })),
}
const DeltoBootstrapMock = vi.fn()
DeltoBootstrapMock.prototype = prototype

export default vi.mocked(DeltoBootstrapMock as unknown as typeof DeltoBootstrap)

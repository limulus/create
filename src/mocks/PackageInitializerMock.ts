import { vi } from 'vitest'

import PackageInitializer from '../lib/PackageInitializer.ts'

// vitest 4 constructs mock implementations with `new`, so the mocked shape is supplied
// via `prototype` rather than an arrow-function implementation (which is not constructable).
const prototype = {
  initialize: vi.fn(),
}
const PackageInitializerMock = vi.fn()
PackageInitializerMock.prototype = prototype

export default vi.mocked(PackageInitializerMock as unknown as typeof PackageInitializer)

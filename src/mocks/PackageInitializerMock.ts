import { vi } from 'vitest'

import PackageInitializer from '../lib/PackageInitializer.js'

const prototype = {
  initialize: vi.fn(),
}
const PackageInitializerMock = vi.fn().mockImplementation(() => prototype)
PackageInitializerMock.prototype = prototype

export default vi.mocked(PackageInitializerMock as unknown as typeof PackageInitializer)

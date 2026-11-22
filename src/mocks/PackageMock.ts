import { vi } from 'vitest'

import Package from '../lib/Package.ts'

const prototype = {
  name: '@mock/package',
  isPrivate: true,
  moduleConfig: {
    module: 'NodeNext',
    moduleResolution: 'nodenext',
    types: ['node'],
  },
}
const PackageMock = vi.fn()
PackageMock.prototype = prototype

export default vi.mocked(PackageMock as unknown as typeof Package)

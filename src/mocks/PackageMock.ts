import { vi } from 'vitest'

import Package from '../lib/Package.js'

export default vi.mocked(
  vi.fn().mockImplementation(() => ({
    moduleConfig: {
      module: 'NodeNext',
      moduleResolution: 'nodenext',
      types: ['node'],
    },
  })) as unknown as typeof Package
)

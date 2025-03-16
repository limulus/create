import { jest } from '@jest/globals'

import Package from '../lib/Package.js'

export default jest.fn().mockImplementation(() => ({
  moduleConfig: {
    module: 'NodeNext',
    moduleResolution: 'nodenext',
    types: ['node'],
  },
})) as unknown as jest.MockedClass<typeof Package>

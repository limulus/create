import { jest } from '@jest/globals'

import Package from '../lib/Package'

export default jest.fn().mockImplementation(() => ({})) as unknown as jest.MockedClass<
  typeof Package
>

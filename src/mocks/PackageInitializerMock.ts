import { jest } from '@jest/globals'

import PackageInitializer from '../lib/PackageInitializer.js'

const prototype = {
  initialize: jest.fn(),
}
const PackageInitializerMock = jest.fn().mockImplementation(() => prototype)
PackageInitializerMock.prototype = prototype

export default PackageInitializerMock as unknown as jest.MockedClass<
  typeof PackageInitializer
>

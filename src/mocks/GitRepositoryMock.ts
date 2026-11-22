import { vi } from 'vitest'

import GitRepository from '../lib/GitRepository.ts'

const prototype = {
  githubRepository: vi.fn(async () => ({ owner: 'origin-owner', repo: 'origin-repo' })),
  author: vi.fn(async () => ({ name: 'Git Author', email: 'git@example.com' })),
}
const GitRepositoryMock = vi.fn()
GitRepositoryMock.prototype = prototype

export default vi.mocked(GitRepositoryMock as unknown as typeof GitRepository)

#!/usr/bin/env node

import { CLI } from '../'

const cli = new CLI(process)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
cli.run()

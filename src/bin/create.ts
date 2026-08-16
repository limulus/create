#!/usr/bin/env node

import { CLI } from '../index.ts'

const cli = new CLI(process)

await cli.run()

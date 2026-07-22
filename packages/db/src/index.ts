import {neon} from '@neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-http'
import * as schema from './schema'
import * as relations from './relations'

const fullSchema = {...schema, ...relations}

export type Database = ReturnType<typeof createDb>

export function createDb(connectionString: string) {
  const sql = neon(connectionString)
  return drizzle(sql, {schema: fullSchema})
}

export function tryCreateDb(connectionString?: string | null): Database | null {
  if (!connectionString) return null
  return createDb(connectionString)
}

export * from './schema'
export * from './relations'

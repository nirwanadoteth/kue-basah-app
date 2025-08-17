import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import { db } from './database'

export const auth = betterAuth({
  // It's recommended to store the secret in an environment variable
  // and read it from process.env
  secret: '26e724ad3b0be57453023be12272d762cc1f6334fba1ca57d460ec57c2031594',
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username()],
})

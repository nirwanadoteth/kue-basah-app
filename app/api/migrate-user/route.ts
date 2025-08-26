import { NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { auth } from '@/lib/auth'

// Define the structure of the legacy user for type safety
interface LegacyUser {
  id: number
  username: string
  password_hash: string
}

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: 'Username and password are required.' },
      { status: 400 },
    )
  }

  // It's crucial to create a new client for each serverless function invocation.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, message: 'DATABASE_URL is not set.' },
      { status: 500 },
    )
  }
  const client = postgres(process.env.DATABASE_URL)
  const db = drizzle(client)

  try {
    // Step 1: Find the user in the legacy table
    const legacyUsers: LegacyUser[] = await db
      .select()
      .from(sql`legacy_users`)
      .where(sql`username = ${username}`)

    const legacyUser = legacyUsers[0]

    if (!legacyUser) {
      // User does not exist in the legacy system, so we can assume they are a new user.
      // The normal better-auth flow will handle them.
      return NextResponse.json({ success: true, migrated: false })
    }

    // Step 2: Authenticate the user using the old postgres function
    const authResult: { user_id: number; username: string }[] = await db.execute(
      sql`SELECT * FROM authenticate_user(${username}, ${password})`,
    )

    if (authResult.length === 0) {
      // Legacy authentication failed.
      // We don't want to reveal that the user exists, so we'll let the standard login fail.
      return NextResponse.json({ success: true, migrated: false })
    }

    // Step 3: Authentication successful, create user in better-auth system
    const newUser = await auth.api.createUser({
      body: {
        // We pass the plain password here; better-auth handles the hashing.
        password: password,
        // Other user details
        name: legacyUser.username,
        username: legacyUser.username,
        displayUsername: legacyUser.username,
        // Generate a placeholder email as the old system didn't have one.
        email: `${legacyUser.username}@placeholder.local`,
        emailVerified: true, // We can consider the user verified as they've proven password ownership.
      },
    })

    if (!newUser || !newUser.id) {
      throw new Error('Failed to create user in the new system.')
    }

    // Step 4: Update existing records (e.g., transactions) to use the new user ID
    const oldId = legacyUser.id.toString()
    const newId = newUser.id

    await db.execute(
      sql`UPDATE transactions SET user_id = ${newId} WHERE user_id = ${oldId}`,
    )

    // Step 5: Delete the user from the legacy table
    await db.execute(sql`DELETE FROM legacy_users WHERE id = ${legacyUser.id}`)

    return NextResponse.json({ success: true, migrated: true })
  } catch (error) {
    console.error('Migration error:', error)
    // If migration fails, we don't want to block login.
    // We will let the standard flow attempt to log in.
    // The user can try again next time.
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during user migration.',
      },
      { status: 500 },
    )
  } finally {
    // Ensure the database connection is closed.
    await client.end()
  }
}

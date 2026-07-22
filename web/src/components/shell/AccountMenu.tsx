'use client'

import {SignInButton, useClerk, useUser} from '@clerk/nextjs'
import {useRouter} from 'next/navigation'
import {Avatar} from '@/components/ui/Avatar'
import {Menu, MenuButton, MenuLink, MenuSeparator} from '@/components/ui/Menu'

/**
 * One account control, replacing the old header's separate "Profile" link, bare
 * Clerk `UserButton`, and settings gear. Everything about *you* lives here.
 */
export function AccountMenu() {
  const {user, isLoaded} = useUser()
  const {signOut} = useClerk()
  const router = useRouter()

  if (!isLoaded) {
    return <span className="skeleton block h-11 w-11 rounded-full" aria-hidden />
  }

  if (!user) {
    return (
      <SignInButton mode="modal">
        <button type="button" className="btn btn--secondary btn-sm">
          Sign in
        </button>
      </SignInButton>
    )
  }

  const name = user.fullName || user.username || 'Your account'

  return (
    <Menu
      label="Your account"
      trigger={<Avatar name={name} src={user.imageUrl} size="md" ring />}
    >
      <div className="px-3 py-2">
        <p className="truncate-1 text-[0.95rem] font-semibold text-ink">{name}</p>
        {user.primaryEmailAddress?.emailAddress ? (
          <p className="truncate-1 text-[0.85rem] text-ink-faint">
            {user.primaryEmailAddress.emailAddress}
          </p>
        ) : null}
      </div>
      <MenuSeparator />
      <MenuLink href="/me" icon="user">
        Your profile
      </MenuLink>
      <MenuLink href="/chat" icon="messages">
        Messages
      </MenuLink>
      <MenuLink href="/contribute" icon="compose">
        Share a story
      </MenuLink>
      <MenuLink href="/settings" icon="settings">
        Settings
      </MenuLink>
      <MenuSeparator />
      <MenuButton icon="signout" onClick={() => void signOut(() => router.push('/'))}>
        Sign out
      </MenuButton>
    </Menu>
  )
}

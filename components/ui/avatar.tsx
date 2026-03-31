'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

const avatarGradients = [
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-violet-400 to-violet-600',
  'bg-gradient-to-br from-rose-400 to-rose-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-sky-400 to-sky-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-teal-400 to-teal-600',
  'bg-gradient-to-br from-indigo-400 to-indigo-600',
  'bg-gradient-to-br from-orange-400 to-orange-600',
]

function getAvatarGradient(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length]
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  // Auto-generate gradient color from children text if no explicit bg class is provided
  const hasExplicitBg = className && /\b(bg-|from-)/.test(className)
  const childText = typeof children === 'string' ? children : ''
  const autoGradient = !hasExplicitBg && childText ? getAvatarGradient(childText) : ''

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full',
        autoGradient || (!hasExplicitBg ? 'bg-muted' : ''),
        autoGradient ? 'text-white font-semibold' : '',
        className,
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  )
}

export { Avatar, AvatarImage, AvatarFallback }

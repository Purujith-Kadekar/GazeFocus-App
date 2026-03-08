import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, externalId, folderId, title } = body

    if (!type || !externalId) {
      return NextResponse.json(
        { error: 'Type and externalId are required' },
        { status: 400 }
      )
    }

    // If folderId is provided, check if item already exists in this specific folder
    if (folderId) {
      const existingInFolder = await db.libraryItem.findFirst({
        where: {
          userId: user.id,
          type,
          externalId,
          folderId,
        },
      })

      if (existingInFolder) {
        return NextResponse.json(existingInFolder)
      }

      // Try to create - if unique constraint fails (item in another folder), handle gracefully
      try {
        const item = await db.libraryItem.create({
          data: {
            userId: user.id,
            type,
            externalId,
            folderId,
            title: title || externalId,
          },
        })
        return NextResponse.json(item, { status: 201 })
      } catch (createError: unknown) {
        if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 'P2002') {
          const existing = await db.libraryItem.findFirst({
            where: { userId: user.id, type, externalId },
          })
          return NextResponse.json(existing)
        }
        throw createError
      }
    }

    // If no folderId, check if item already exists without a folder
    const existingItem = await db.libraryItem.findFirst({
      where: {
        userId: user.id,
        type,
        externalId,
        folderId: null,
      },
    })

    if (existingItem) {
      return NextResponse.json(existingItem)
    }

    const item = await db.libraryItem.create({
      data: {
        userId: user.id,
        type,
        externalId,
        folderId: null,
        title: title || externalId,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating library item:', error)
    return NextResponse.json(
      { error: 'Failed to create library item' },
      { status: 500 }
    )
  }
}

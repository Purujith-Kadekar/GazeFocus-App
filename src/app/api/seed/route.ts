import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', debug: 'No session' }, { status: 401 })
    }
    
    const userId = session.user.id
    const prefix = userId.slice(0, 8)
    const now = new Date().toISOString()

    await db.from('UserSettings').upsert({
      userId,
    }, {
      onConflict: 'userId',
    })

    const folder1Id = `folder-webdev-${prefix}`
    const folder2Id = `folder-ml-${prefix}`
    const folder3Id = `folder-design-${prefix}`

    const { data: folder1 } = await db.from('Folder').upsert({
      id: folder1Id,
      title: 'Web Development',
      description: 'Frontend and backend courses',
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    }).select().single()

    const { data: folder2 } = await db.from('Folder').upsert({
      id: folder2Id,
      title: 'Machine Learning',
      description: 'AI and ML tutorials',
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    }).select().single()

    const { data: folder3 } = await db.from('Folder').upsert({
      id: folder3Id,
      title: 'Design',
      description: 'UI/UX design principles',
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    }).select().single()

    const playlist1Id = `playlist-react-${prefix}`
    const playlist2Id = `playlist-nn-${prefix}`

    const { data: playlist1 } = await db.from('Playlist').upsert({
      id: playlist1Id,
      youtubeId: 'PLr6zIGLY6i8M6NULnJpGsZ1FDwmLheJga',
      title: 'React - The Complete Guide 2024',
      description: 'Master React.js with hooks, routing, state management and more',
      thumbnail: 'https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
      channelId: 'UCrUDmdevZdRc5yVQk-dnmDg',
      channelName: 'Academind',
      totalDuration: 50000,
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    }).select().single()

    const { data: playlist2 } = await db.from('Playlist').upsert({
      id: playlist2Id,
      youtubeId: 'PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
      title: 'Neural Networks from Scratch',
      description: 'Learn neural networks with intuitive explanations',
      thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
      channelId: 'UCNOtHOBA6J7Fv0-BhJpasCg',
      channelName: '3Blue1Brown',
      totalDuration: 4000,
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    }).select().single()

    await db.from('LibraryItem').upsert({
      id: `item-react-${prefix}`,
      userId,
      folderId: folder1?.id || folder1Id,
      type: 'PLAYLIST',
      externalId: playlist1?.youtubeId || 'PLr6zIGLY6i8M6NULnJpGsZ1FDwmLheJga',
      title: playlist1?.title || 'React - The Complete Guide 2024',
      metadata: {
        thumbnail: playlist1?.thumbnail || 'https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
        channelName: playlist1?.channelName || 'Academind',
      },
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    })

    await db.from('LibraryItem').upsert({
      id: `item-nn-${prefix}`,
      userId,
      folderId: folder2?.id || folder2Id,
      type: 'PLAYLIST',
      externalId: playlist2?.youtubeId || 'PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
      title: playlist2?.title || 'Neural Networks from Scratch',
      metadata: {
        thumbnail: playlist2?.thumbnail || 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
        channelName: playlist2?.channelName || '3Blue1Brown',
      },
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    })

    await db.from('Video').upsert({
      id: `video-react-${prefix}`,
      youtubeId: 'Ke90Tje7VS0',
      title: 'React JS Tutorial - Full Course for Beginners',
      description: 'A complete introduction to React.js',
      thumbnail: 'https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
      duration: 14000,
      playlistId: playlist1?.id || playlist1Id,
      userId,
      position: 0,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    })

    await db.from('Video').upsert({
      id: `video-nn-${prefix}`,
      youtubeId: 'aircAruvnKk',
      title: 'But what is a neural network?',
      description: 'Deep learning introduction',
      thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
      duration: 1200,
      playlistId: playlist2?.id || playlist2Id,
      userId,
      position: 0,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    })

    await db.from('Note').upsert({
      id: `note-react-${prefix}`,
      content: 'React components are reusable pieces of UI. Always start component names with capital letters.',
      timestampSeconds: 120,
      isImportant: true,
      youtubeId: 'Ke90Tje7VS0',
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    })

    await db.from('Note').upsert({
      id: `note-nn-${prefix}`,
      content: 'Neural networks learn by adjusting weights through backpropagation.',
      timestampSeconds: 450,
      isImportant: true,
      youtubeId: 'aircAruvnKk',
      userId,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'id',
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}

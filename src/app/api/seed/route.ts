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

    await db.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })

    const folder1 = await db.folder.upsert({
      where: { id: `folder-webdev-${prefix}` },
      update: {},
      create: {
        id: `folder-webdev-${prefix}`,
        title: 'Web Development',
        description: 'Frontend and backend courses',
        userId,
      },
    })

    const folder2 = await db.folder.upsert({
      where: { id: `folder-ml-${prefix}` },
      update: {},
      create: {
        id: `folder-ml-${prefix}`,
        title: 'Machine Learning',
        description: 'AI and ML tutorials',
        userId,
      },
    })

    const folder3 = await db.folder.upsert({
      where: { id: `folder-design-${prefix}` },
      update: {},
      create: {
        id: `folder-design-${prefix}`,
        title: 'Design',
        description: 'UI/UX design principles',
        userId,
      },
    })

    const playlist1 = await db.playlist.upsert({
      where: { id: `playlist-react-${prefix}` },
      update: {},
      create: {
        id: `playlist-react-${prefix}`,
        youtubeId: 'PLr6zIGLY6i8M6NULnJpGsZ1FDwmLheJga',
        title: 'React - The Complete Guide 2024',
        description: 'Master React.js with hooks, routing, state management and more',
        thumbnail: 'https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
        channelId: 'UCrUDmdevZdRc5yVQk-dnmDg',
        channelName: 'Academind',
        totalDuration: 50000,
        userId,
      },
    })

    const playlist2 = await db.playlist.upsert({
      where: { id: `playlist-nn-${prefix}` },
      update: {},
      create: {
        id: `playlist-nn-${prefix}`,
        youtubeId: 'PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
        title: 'Neural Networks from Scratch',
        description: 'Learn neural networks with intuitive explanations',
        thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
        channelId: 'UCNOtHOBA6J7Fv0-BhJpasCg',
        channelName: '3Blue1Brown',
        totalDuration: 4000,
        userId,
      },
    })

    await db.libraryItem.upsert({
      where: { id: `item-react-${prefix}` },
      update: {},
      create: {
        id: `item-react-${prefix}`,
        userId,
        folderId: folder1.id,
        type: 'PLAYLIST',
        externalId: playlist1.youtubeId,
        title: playlist1.title,
        metadata: {
          thumbnail: playlist1.thumbnail,
          channelName: playlist1.channelName,
        },
      },
    })

    await db.libraryItem.upsert({
      where: { id: `item-nn-${prefix}` },
      update: {},
      create: {
        id: `item-nn-${prefix}`,
        userId,
        folderId: folder2.id,
        type: 'PLAYLIST',
        externalId: playlist2.youtubeId,
        title: playlist2.title,
        metadata: {
          thumbnail: playlist2.thumbnail,
          channelName: playlist2.channelName,
        },
      },
    })

    await db.video.upsert({
      where: { id: `video-react-${prefix}` },
      update: {},
      create: {
        id: `video-react-${prefix}`,
        youtubeId: 'Ke90Tje7VS0',
        title: 'React JS Tutorial - Full Course for Beginners',
        description: 'A complete introduction to React.js',
        thumbnail: 'https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg',
        duration: 14000,
        playlistId: playlist1.id,
        userId,
        position: 0,
      },
    })

    await db.video.upsert({
      where: { id: `video-nn-${prefix}` },
      update: {},
      create: {
        id: `video-nn-${prefix}`,
        youtubeId: 'aircAruvnKk',
        title: 'But what is a neural network?',
        description: 'Deep learning introduction',
        thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
        duration: 1200,
        playlistId: playlist2.id,
        userId,
        position: 0,
      },
    })

    await db.note.upsert({
      where: { id: `note-react-${prefix}` },
      update: {},
      create: {
        id: `note-react-${prefix}`,
        content: 'React components are reusable pieces of UI. Always start component names with capital letters.',
        timestampSeconds: 120,
        isImportant: true,
        youtubeId: 'Ke90Tje7VS0',
        userId,
      },
    })

    await db.note.upsert({
      where: { id: `note-nn-${prefix}` },
      update: {},
      create: {
        id: `note-nn-${prefix}`,
        content: 'Neural networks learn by adjusting weights through backpropagation.',
        timestampSeconds: 450,
        isImportant: true,
        youtubeId: 'aircAruvnKk',
        userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}

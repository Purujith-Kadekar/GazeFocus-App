import FolderDetailClient from './FolderDetailClient'

export default async function FolderDetailPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params

  return <FolderDetailClient folderId={folderId} />
}

import { getFolders } from '@/lib/api';
import Link from 'next/link';
import { CreateFolderButton } from '@/components/actions/CreateFolderButton';
import { FolderActions } from '@/components/actions/FolderActions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptDisplay } from '@/components/PromptDisplay';

// Revalidate data every 60 seconds (or use on-demand revalidation later)
export const revalidate = 60;

// --- Sidebar --- 
async function SidebarContent() {
  // Fetch folders within the Server Component
  const folders = await getFolders();

  return (
    <nav className="flex-grow">
      <ul className="space-y-1">
        {/* Link for "All Prompts" */}
        <li>
          <Link 
            href="/" 
            className="flex items-center p-2 rounded hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700 dark:text-gray-300 text-sm"
          >
            📚 All Prompts
          </Link>
          </li>
        {/* Folder List */}
        {folders.map((folder) => (
          <li key={folder.id}>
            <div className="flex items-center justify-between p-2 rounded hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700 dark:text-gray-300 text-sm group">
                <Link href={`/?folderId=${folder.id}`} className="flex-grow truncate mr-2">
                    {folder.emoji || '📁'} {folder.name} 
                    <span className="text-xs text-muted-foreground">({folder._count?.prompts || 0})</span>
                </Link>
                {/* Actions appear on hover/focus within group */}
                <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <FolderActions folder={folder} /> 
                </div>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarSkeleton() {
    return (
        <div className="flex-grow space-y-2 p-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-full" />
        </div>
    )
}

function Sidebar() {
    return (
      <aside className="w-64 bg-card p-4 border-r flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-4">Folders</h2>
        <Suspense fallback={<SidebarSkeleton/>}>
          <SidebarContent />
        </Suspense>
        <div className="mt-auto pt-4 border-t">
          <CreateFolderButton /> 
        </div>
      </aside>
    )
}

// --- Prompt List Container (Server Component) ---
// Renamed from PromptListContent. Only fetches non-dynamic data (all folders).
async function PromptListContainer() {
  // Fetch all folders to pass to the client component
  const allFolders = await getFolders();

  // Render the client component responsible for fetching/displaying prompts
  return <PromptDisplay allFolders={allFolders} />;
}

// Remove PromptListSkeleton from here, it's defined in PromptDisplay now

// The main page component
export default async function HomePage() { // No longer needs searchParams
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* Suspense boundary around the client component fetch */}
      {/* Pass searchParams down to the client component */}
      <Suspense fallback={<PromptListSkeleton />}> {/* Use skeleton from PromptDisplay */}
         <PromptListContainer />
      </Suspense>
    </div>
  );
}

// Define PromptListSkeleton here if not exported from PromptDisplay
// For simplicity, let's keep it defined in PromptDisplay.tsx for now.
function PromptListSkeleton() {
    return (
        <main className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </main>
    )
}

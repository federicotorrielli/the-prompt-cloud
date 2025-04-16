'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { getPrompts, getFolderById, Folder, Prompt } from '@/lib/api';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton'; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePromptButton } from '@/components/actions/CreatePromptButton';
import { PromptActions } from '@/components/actions/PromptActions';
import { CopyButton } from '@/components/actions/CopyButton';
import { PromptDetailModal } from '@/components/actions/PromptDetailModal';
import { useDebounce } from 'use-debounce';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define sort options
const sortOptions = {
    'createdAt-desc': { label: 'Newest', field: 'createdAt', order: 'desc' },
    'createdAt-asc': { label: 'Oldest', field: 'createdAt', order: 'asc' },
    'title-asc': { label: 'Title (A-Z)', field: 'title', order: 'asc' },
    'title-desc': { label: 'Title (Z-A)', field: 'title', order: 'desc' },
} as const; // Use const assertion for type safety
type SortKey = keyof typeof sortOptions;

// Update fetcher function signature to include sort config
const promptsFetcher = ([, folderId, searchTerm, sortConfig]: [string, string | null, string, typeof sortOptions[SortKey]]) => 
    getPrompts(folderId ?? undefined, searchTerm, sortConfig.field, sortConfig.order);

const folderFetcher = ([, folderId]: [string, string | null]) => {
    if (!folderId) return null; 
    return getFolderById(folderId);
};

interface PromptDisplayProps {
  allFolders: Folder[]; 
}

export function PromptDisplay({ allFolders }: PromptDisplayProps) {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');

  // State for search input
  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search term to avoid rapid API calls
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // 300ms debounce

  // State for detail modal
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for sorting
  const [sortKey, setSortKey] = useState<SortKey>('createdAt-desc'); // Default sort state
  const currentSortConfig = sortOptions[sortKey];

  // Update SWR hook to use keepPreviousData
  const { 
    data: prompts, 
    error: promptsError, 
    isLoading: promptsLoading 
  } = useSWR(
    ['prompts', folderId, debouncedSearchTerm, currentSortConfig], // Add sortConfig
    promptsFetcher,
    { 
      keepPreviousData: true, // Keep displaying old data while loading new search
    }
  );

  const { data: currentFolder, error: folderError } = useSWR(
    folderId ? ['folder', folderId] : null, 
    folderFetcher
    // No need for keepPreviousData here unless folder transitions feel rough
  );

  // Adjust loading state: Primarily rely on promptsLoading for the list itself
  // The keepPreviousData option means we won't show the main skeleton during search updates
  const isInitialLoading = promptsLoading && !prompts; 
  const error = promptsError || folderError;

  // Function to open modal
  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  // Handle initial loading state
  if (isInitialLoading) { 
    return <PromptListSkeleton showSearch={true} showSort={true} />;
  }

  // Handle error state
  if (error) {
    console.error("SWR Error:", error);
    return <p className="text-red-500 p-6">Failed to load prompts. Please try again.</p>;
  }

  return (
    <main className="flex-1 p-6 bg-background overflow-y-auto flex flex-col">
      {/* Header Area */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold truncate">
          {currentFolder 
            ? <><span className="mr-2">{currentFolder.emoji || '📁'}</span>{currentFolder.name}</>
            : 'All Prompts'} 
        </h1>
        <div className="flex items-center gap-2">
           {/* Search Input */}
           <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search prompts..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                 {searchTerm && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer"
                        onClick={() => setSearchTerm('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Sort Select Dropdown */}
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(sortOptions).map(([key, option]) => (
                        <SelectItem key={key} value={key}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          <CreatePromptButton folders={allFolders} currentFolderId={folderId} />
        </div>
      </div>

      {/* Prompt List Area */}
      <div className="space-y-4 flex-grow overflow-y-auto pr-2 relative"> {/* Add relative positioning */} 
         {/* Subtle loading indicator overlay during search revalidation */}
         {promptsLoading && !isInitialLoading && (
             <div className="absolute inset-0 bg-background/50 flex justify-center items-start pt-10 z-10">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
             </div>
         )}

        {/* Display prompt list (shows previous data during load because of keepPreviousData) */}
        {!prompts || prompts.length === 0 ? (
          <p className="text-muted-foreground italic text-center pt-10">
            {debouncedSearchTerm ? `No prompts found matching "${debouncedSearchTerm}".` : 'No prompts found in this view.'}
          </p>
        ) : (
          prompts.map((prompt: Prompt) => ( 
             // Make the main div clickable, but stop propagation from buttons inside
            <div 
                key={prompt.id} 
                className="p-4 border rounded-lg shadow-sm bg-card group relative hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePromptClick(prompt)} // Open modal on click
            >
                <div 
                    className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when clicking actions
                >
                    <CopyButton textToCopy={prompt.content} className="h-6 w-6" />
                    <PromptActions 
                        prompt={prompt} 
                        folders={allFolders} 
                        currentFolderId={folderId}
                    />
                </div>
              <h3 className="text-lg font-semibold">
                {prompt.emoji || '📝'} {prompt.title}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm line-clamp-2 pr-16">
                {prompt.content}
              </p> 
              <div className="text-xs text-muted-foreground mt-2">
                {prompt.folder && (
                    <Link href={`/?folderId=${prompt.folderId}`} className="hover:underline">
                        Folder: {prompt.folder.emoji || '📁'} {prompt.folder.name}
                    </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

        {/* Render the Detail Modal */} 
        <PromptDetailModal 
            prompt={selectedPrompt} 
            isOpen={isModalOpen} 
            onOpenChange={setIsModalOpen} 
            // Pass other props if needed later for edit/delete actions within modal
            // folders={allFolders} 
            // currentFolderId={folderId}
        />
    </main>
  );
}

// Update skeleton to include search bar placeholder
function PromptListSkeleton({ showSearch = false, showSort = false }: { showSearch?: boolean, showSort?: boolean }) {
    return (
        <main className="flex-1 p-6 flex flex-col">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6 pb-4 border-b">
                <Skeleton className="h-8 w-48" />
                <div className="flex items-center gap-2">
                    {showSearch && <Skeleton className="h-10 w-64" />} {/* Search Skeleton */}
                    {showSort && <Skeleton className="h-10 w-[180px]" />} {/* Sort Skeleton */}
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </main>
    )
} 
'use client';

import React from 'react';
import { Prompt } from '@/lib/api';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';
import { CopyButton } from './CopyButton';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void; 
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString(undefined, { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
    });
}

export function PromptDetailModal({
  prompt,
  isOpen,
  onOpenChange,
}: PromptDetailModalProps) {

  if (!prompt) return null; // Don't render if no prompt is selected

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="text-2xl mr-3">{prompt.emoji || '📝'}</span>
            {prompt.title}
          </DialogTitle>
           {/* Optional: Add description or tags here later */}
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* Offset padding for scrollbar */}
          <div className="text-sm text-muted-foreground mb-4 space-x-4">
            <span>Created: {formatDate(prompt.createdAt)}</span>
            <span>Updated: {formatDate(prompt.updatedAt)}</span>
          </div>

          {prompt.folder && (
            <div className="mb-4 text-sm">
              <span className="font-semibold">Folder:</span> 
              <Link 
                href={`/?folderId=${prompt.folderId}`} 
                className="ml-2 text-primary hover:underline"
                onClick={() => onOpenChange(false)} // Close modal on link click
              >
                {prompt.folder.emoji || '📁'} {prompt.folder.name}
              </Link>
            </div>
          )}

           <div className="relative group">
                <pre className="whitespace-pre-wrap break-words bg-muted p-4 rounded-md text-muted-foreground text-sm font-mono">
                  {prompt.content}
                </pre>
                <CopyButton 
                    textToCopy={prompt.content} 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                />
           </div>
        </ScrollArea>

        {/* Footer could have Edit/Delete actions later */}
        {/* <DialogFooter> ... </DialogFooter> */}

      </DialogContent>
    </Dialog>
  );
} 
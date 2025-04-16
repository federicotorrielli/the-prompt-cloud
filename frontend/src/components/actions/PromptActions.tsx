'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Prompt, Folder, deletePrompt } from '@/lib/api';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSWRConfig } from 'swr';

import { PromptForm } from './PromptForm';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

interface PromptActionsProps {
  prompt: Prompt;
  folders: Folder[]; // Need folders for the edit form's dropdown
  currentFolderId: string | null; // Accept the current folder ID
}

export function PromptActions({ prompt, folders, currentFolderId }: PromptActionsProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const keyToMutate = ['prompts', currentFolderId];
    try {
      await deletePrompt(prompt.id);
      toast.success(`Prompt "${prompt.title}" deleted successfully!`);
      mutate(keyToMutate);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete prompt.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer">
            <Pencil className="h-4 w-4" />
             <span className="sr-only">Edit Prompt</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update the details for this prompt.
            </DialogDescription>
          </DialogHeader>
          {/* Pass prompt and folders data to the form */}
          <PromptForm 
              prompt={prompt} 
              folders={folders} 
              currentFolderId={currentFolderId}
              onSuccess={() => setIsEditOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 cursor-pointer">
            <Trash2 className="h-4 w-4" />
             <span className="sr-only">Delete Prompt</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the prompt 
                <span className="font-semibold">{prompt.emoji} {prompt.title}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
            >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Prompt
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </div>
  );
} 
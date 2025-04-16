'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Folder, deleteFolder } from '@/lib/api';
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

import { FolderForm } from './FolderForm';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

interface FolderActionsProps {
  folder: Folder;
}

export function FolderActions({ folder }: FolderActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
      toast.success(`Folder "${folder.name}" deleted successfully!`);
      
      // Check if the deleted folder was the currently viewed one
      const currentFolderId = searchParams.get('folderId');
      if (currentFolderId === folder.id) {
        // Redirect to the "All Prompts" view
        router.push('/');
      }
      router.refresh(); // Refresh data regardless
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete folder.");
    } finally {
      setIsDeleting(false);
      // AlertDialog closes automatically on action click
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Folder</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the name or emoji for this folder.
            </DialogDescription>
          </DialogHeader>
          <FolderForm folder={folder} onSuccess={() => setIsEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
           <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 cursor-pointer">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Folder</span>
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the folder 
                <span className="font-semibold">{folder.emoji} {folder.name}</span> 
                and all prompts inside it.
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
                Delete Folder
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </div>
  );
} 
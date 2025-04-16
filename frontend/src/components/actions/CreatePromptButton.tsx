'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PromptForm } from './PromptForm';
import { Folder } from '@/lib/api';
import { PlusCircle } from 'lucide-react';

interface CreatePromptButtonProps {
  folders: Folder[]; // Pass folders for the dropdown
  currentFolderId?: string | null; // Add optional prop for current folder ID
}

export function CreatePromptButton({ folders, currentFolderId }: CreatePromptButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <PlusCircle className="mr-2 h-4 w-4" /> New Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
          <DialogDescription>
            Add a new prompt to your collection. You can optionally assign it to a folder.
          </DialogDescription>
        </DialogHeader>
        <PromptForm 
            folders={folders} 
            currentFolderId={currentFolderId}
            onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
} 
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
import { FolderForm } from './FolderForm';
import { FolderPlus } from 'lucide-react';

export function CreateFolderButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start cursor-pointer">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Organize your prompts by creating a new folder.
          </DialogDescription>
        </DialogHeader>
        <FolderForm onSuccess={() => setOpen(false)} /> {/* Close dialog on success */}
      </DialogContent>
    </Dialog>
  );
} 
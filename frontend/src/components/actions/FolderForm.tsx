'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Folder, createFolder, updateFolder } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

const folderSchema = z.object({
  name: z.string().min(1, { message: "Folder name is required" }),
  emoji: z.string().refine(val => !val || val.length <= 2, { 
      message: "Must be a single emoji" 
  }).optional().nullable(),
});

type FolderFormData = z.infer<typeof folderSchema>;

interface FolderFormProps {
  folder?: Folder | null;
  onSuccess?: () => void;
}

export function FolderForm({ folder, onSuccess }: FolderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!folder;

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder?.name || '',
      emoji: folder?.emoji || null,
    },
  });

  const currentEmoji = watch('emoji');

  useEffect(() => {
    reset({
      name: folder?.name || '',
      emoji: folder?.emoji || null,
    });
  }, [folder, reset]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setValue('emoji', emojiData.emoji, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<FolderFormData> = async (data) => {
    setIsLoading(true);
    const payload = {
        name: data.name,
        emoji: (data.emoji === null || data.emoji === '') ? undefined : data.emoji,
    };

    try {
      if (isEditing && folder) {
        await updateFolder(folder.id, payload);
        toast.success(`Folder "${data.name}" updated successfully!`);
      } else {
        await createFolder(payload);
        toast.success(`Folder "${data.name}" created successfully!`);
      }
      router.refresh();
      onSuccess?.();
      reset();
    } catch (error) {
      console.error("Failed to save folder:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save folder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name" className="mb-2 block">Folder Name</Label>
        <Input 
          id="name" 
          {...register("name")} 
          placeholder="e.g., Marketing Prompts"
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label className="mb-2 block">Emoji (Optional)</Label>
        <Controller
            name="emoji"
            control={control}
            render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal cursor-pointer" disabled={isLoading}>
                             {field.value ? (
                                <span className="mr-2">{field.value}</span> 
                             ) : (
                                <Smile className="mr-2 h-4 w-4 text-muted-foreground" /> 
                             )}
                            <span className={!field.value ? "text-muted-foreground" : ""}>
                                {field.value ? 'Change Emoji' : 'Select Emoji'}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Suspense 
                            fallback={
                                <div className="flex justify-center items-center h-[350px] w-[318px]" onWheel={e => e.stopPropagation()}>
                                    <Loader2 className="h-6 w-6 animate-spin"/>
                                </div>
                            }
                        >
                            <div onWheel={e => e.stopPropagation()}>
                                <EmojiPicker 
                                    onEmojiClick={onEmojiClick} 
                                    searchDisabled
                                    skinTonesDisabled
                                />
                            </div>
                        </Suspense>
                    </PopoverContent>
                </Popover>
            )}
         />
        {errors.emoji && <p className="text-sm text-red-500 mt-1">{errors.emoji.message}</p>}
      </div>
      <DialogFooter>
        {currentEmoji && (
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setValue('emoji', null)} 
                disabled={isLoading}
                className="mr-auto cursor-pointer"
            >
                Clear Emoji
            </Button>
        )}
        <Button type="submit" disabled={isLoading} className="cursor-pointer">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? 'Save Changes' : 'Create Folder'}
        </Button>
      </DialogFooter>
    </form>
  );
} 
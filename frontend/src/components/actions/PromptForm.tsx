'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Prompt, Folder, createPrompt, updatePrompt } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSWRConfig } from 'swr';
import { Loader2, Smile } from 'lucide-react';
import { EmojiClickData } from 'emoji-picker-react';

// Lazy load the EmojiPicker component
const LazyEmojiPicker = lazy(() => import('emoji-picker-react'));

const promptSchema = z.object({
  title: z.string().min(1, { message: "Prompt title is required" }),
  content: z.string().min(1, { message: "Prompt content is required" }),
  emoji: z.string().refine(val => !val || val.length <= 2, { 
      message: "Must be a single emoji" 
  }).optional().nullable(),
  folderId: z.string().optional().nullable(), // Folder ID is optional
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptFormProps {
  prompt?: Prompt | null; // Prompt data for editing, null/undefined for creating
  folders: Folder[]; // List of available folders for the dropdown
  currentFolderId?: string | null; // Changed from initialFolderId
  onSuccess?: () => void; // Optional callback on successful save
}

export function PromptForm({ prompt, folders, currentFolderId, onSuccess }: PromptFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!prompt;
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt?.title || '',
      content: prompt?.content || '',
      emoji: prompt?.emoji || null,
      folderId: isEditing ? (prompt?.folderId || null) : (currentFolderId || null),
    },
  });

  const currentEmoji = watch('emoji');
  const [isPickerOpen, setIsPickerOpen] = useState(false); // State for popover

  useEffect(() => {
    // Reset needs to consider editing vs creating with initial ID
    reset({
      title: prompt?.title || '',
      content: prompt?.content || '',
      emoji: prompt?.emoji || null,
      folderId: isEditing ? (prompt?.folderId || null) : (currentFolderId || null),
    });
  }, [prompt, currentFolderId, reset, isEditing]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setValue('emoji', emojiData.emoji, { shouldValidate: true });
    setIsPickerOpen(false); // Close popover
  };

  const onSubmit: SubmitHandler<PromptFormData> = async (data) => {
    setIsLoading(true);
    const keyToMutate = ['prompts', currentFolderId];
    const payload = {
      title: data.title,
      content: data.content,
      emoji: (data.emoji === null || data.emoji === '') ? undefined : data.emoji,
      folderId: (!data.folderId || data.folderId === 'none') ? null : data.folderId,
    };

    try {
      let savedPrompt: Prompt;
      if (isEditing && prompt) {
        savedPrompt = await updatePrompt(prompt.id, payload);
        toast.success(`Prompt "${savedPrompt.title}" updated successfully!`);
      } else {
        savedPrompt = await createPrompt(payload);
        toast.success(`Prompt "${savedPrompt.title}" created successfully!`);
      }
      mutate(keyToMutate);
      
      if (savedPrompt.folderId) {
          mutate(['folder', savedPrompt.folderId]);
      }

      router.refresh();
      onSuccess?.();
      reset();
    } catch (error) {
      console.error("Failed to save prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save prompt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title" className="mb-2 block">Title</Label>
        <Input 
          id="title" 
          {...register("title")} 
          placeholder="e.g., Generate Ad Copy"
          disabled={isLoading}
        />
        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="content" className="mb-2 block">Prompt Content</Label>
        <Textarea 
          id="content" 
          {...register("content")} 
          placeholder="Write a catchy headline for..."
          rows={6}
          disabled={isLoading}
        />
        {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Emoji (Optional)</Label>
          <Controller
            name="emoji"
            control={control}
            render={({ field }) => (
                <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
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
                            {isPickerOpen && (
                                <div onWheel={e => e.stopPropagation()}>
                                    <LazyEmojiPicker 
                                        onEmojiClick={onEmojiClick} 
                                        searchDisabled
                                        skinTonesDisabled
                                    />
                                </div>
                            )}
                        </Suspense>
                    </PopoverContent>
                </Popover>
            )}
         />
          {errors.emoji && <p className="text-sm text-red-500 mt-1">{errors.emoji.message}</p>}
        </div>
        <div>
          <Label htmlFor="folderId" className="mb-2 block">Folder (Optional)</Label>
          <Controller
            name="folderId"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange} 
                value={field.value ?? 'none'}
                disabled={isLoading}
              >
                <SelectTrigger id="folderId">
                  <SelectValue placeholder="Select a folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Folder --</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.emoji || '📁'} {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
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
          {isEditing ? 'Save Changes' : 'Create Prompt'}
        </Button>
      </DialogFooter>
    </form>
  );
} 
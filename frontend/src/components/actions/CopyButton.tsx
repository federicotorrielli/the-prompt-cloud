'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

export function CopyButton({ textToCopy, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy prompt.');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={`${className} cursor-pointer`}
      aria-label="Copy prompt content"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
} 
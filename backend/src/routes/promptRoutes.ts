import express, { Router, Request, Response, RequestHandler } from 'express';
import prisma from '../lib/prisma'; // Import shared prisma instance
import { Prisma } from '@prisma/client';

const router = Router();

// Get all prompts (optionally filtered by folderId and search term)
router.get('/', (async (req, res) => {
  const { folderId, search, sortBy, sortOrder } = req.query;

  // Build the Prisma where clause dynamically - Use 'any' type
  const whereClause: any = {};

  if (folderId) {
    whereClause.folderId = String(folderId);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchTerm = search.trim();
    whereClause.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } }, // Case-insensitive search
      { content: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Build the orderBy clause - Remove explicit types
  let orderByClause: any = { createdAt: 'desc' }; // Default sort, type as any

  if (typeof sortBy === 'string') {
      const order = (typeof sortOrder === 'string' && sortOrder.toLowerCase() === 'asc') ? 'asc' : 'desc'; // Infer type
      if (sortBy === 'title') {
          orderByClause = { title: order };
      } else if (sortBy === 'createdAt') { 
          orderByClause = { createdAt: order };
      }
      // Add more sortable fields here if needed (e.g., updatedAt)
  }

  try {
    const prompts = await prisma.prompt.findMany({
      where: whereClause, // Use the clause typed as any
      orderBy: orderByClause, // Use dynamic orderBy clause
      include: { folder: true },
    });
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
}) as RequestHandler);

// Create a new prompt
router.post('/', (async (req, res) => {
  const { title, content, emoji, folderId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Prompt title and content are required' });
  }

  try {
    const newPrompt = await prisma.prompt.create({
      data: {
        title,
        content,
        emoji,
        folderId: folderId ? String(folderId) : null,
      },
      include: { folder: true },
    });
    res.status(201).json(newPrompt);
  } catch (error) {
    console.error("Error creating prompt:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2003') {
         return res.status(400).json({ error: 'Invalid folderId provided' });
    }
    res.status(500).json({ error: 'Failed to create prompt' });
  }
}) as RequestHandler);

// Get a single prompt by ID
router.get('/:id', (async (req, res) => {
  const { id } = req.params;
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: { folder: true },
    });
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    console.error(`Error fetching prompt ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
}) as RequestHandler<{ id: string }>);

// Update a prompt
router.put('/:id', (async (req, res) => {
  const { id } = req.params;
  const { title, content, emoji, folderId } = req.body;

  if (title === undefined && content === undefined && emoji === undefined && folderId === undefined) {
    return res.status(400).json({ error: 'No update fields provided (title, content, emoji, or folderId)' });
  }

  try {
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: {
        title: title ?? undefined,
        content: content ?? undefined,
        emoji: emoji ?? undefined,
        folder: folderId === null
                  ? { disconnect: true }
                  : folderId !== undefined
                  ? { connect: { id: String(folderId) } }
                  : undefined,
      },
      include: { folder: true },
    });
    res.json(updatedPrompt);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
        const code = (error as any).code;
        if (code === 'P2025') {
            return res.status(404).json({ error: 'Prompt not found' });
        }
        if (code === 'P2003' || code === 'P2016') {
             return res.status(400).json({ error: 'Invalid folderId provided' });
        }
    }
    console.error(`Error updating prompt ${id}:`, error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
}) as RequestHandler<{ id: string }>);

// Delete a prompt
router.delete('/:id', (async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.prompt.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    console.error(`Error deleting prompt ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
}) as RequestHandler<{ id: string }>);

export default router; 
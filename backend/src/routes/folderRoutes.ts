import express, { Router, Request, Response, RequestHandler } from 'express';
import prisma from '../lib/prisma'; // Import shared prisma instance

const router = Router();

// Get all folders
router.get('/', (async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: { _count: { select: { prompts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
}) as RequestHandler);

// Create a new folder
router.post('/', (async (req, res) => {
  const { name, emoji } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  try {
    const newFolder = await prisma.folder.create({
      data: {
        name,
        emoji,
      },
    });
    res.status(201).json(newFolder);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}) as RequestHandler);

// Get a single folder by ID (including its prompts)
router.get('/:id', (async (req, res) => {
  const { id } = req.params;
  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: { prompts: { orderBy: { createdAt: 'desc' } } },
    });
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    console.error(`Error fetching folder ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
}) as RequestHandler<{ id: string }>);

// Update a folder
router.put('/:id', (async (req, res) => {
  const { id } = req.params;
  const { name, emoji } = req.body;
  if (!name && !emoji) {
      return res.status(400).json({ error: 'No update fields provided (name or emoji)' });
  }
  try {
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: {
        name: name ?? undefined,
        emoji: emoji ?? undefined,
      },
    });
    res.json(updatedFolder);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Folder not found' });
    }
    console.error(`Error updating folder ${id}:`, error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
}) as RequestHandler<{ id: string }>);

// Delete a folder (prompts within it will be deleted due to Cascade rule)
router.delete('/:id', (async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.folder.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Folder not found' });
    }
    console.error(`Error deleting folder ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}) as RequestHandler<{ id: string }>);

export default router; 
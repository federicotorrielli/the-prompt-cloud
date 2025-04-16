const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Generic fetch wrapper for API calls
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Attempt to parse error details from the response body
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Ignore if response body isn't valid JSON
      }
      console.error('API Error Response:', { 
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData 
      });
      throw new Error(errorData?.error || `HTTP error! status: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T; // Or return null, depending on expected behavior
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('API Call Failed:', error);
    // Re-throw the error so it can be caught by the caller (e.g., in React Query)
    throw error;
  }
}

// --- Types (Should mirror Prisma schema + backend API responses) ---

export interface Folder {
  id: string;
  name: string;
  emoji: string | null;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  _count?: { prompts: number }; // Optional prompt count
  prompts?: Prompt[]; // Optional included prompts
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  emoji: string | null;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  folderId: string | null;
  folder?: Folder | null; // Optional included folder
}

// --- API Function Examples --- (Will add more as needed)

// Folders
export const getFolders = (): Promise<Folder[]> => fetchApi<Folder[]>('/folders');
export const createFolder = (data: { name: string; emoji?: string }): Promise<Folder> => fetchApi<Folder>('/folders', { method: 'POST', body: JSON.stringify(data) });
export const getFolderById = (id: string): Promise<Folder> => fetchApi<Folder>(`/folders/${id}`);
export const updateFolder = (id: string, data: { name?: string; emoji?: string }): Promise<Folder> => fetchApi<Folder>(`/folders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFolder = (id: string): Promise<void> => fetchApi<void>(`/folders/${id}`, { method: 'DELETE' });

// Prompts
export const getPrompts = (
    folderId?: string | null, 
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<Prompt[]> => {
    const params = new URLSearchParams();
    if (folderId) {
        params.append('folderId', folderId);
    }
    if (search && search.trim() !== '') {
        params.append('search', search.trim());
    }
    if (sortBy) {
        params.append('sortBy', sortBy);
        // Default to desc if sortOrder is not provided or invalid
        params.append('sortOrder', sortOrder === 'asc' ? 'asc' : 'desc'); 
    }
    const queryString = params.toString();
    const endpoint = `/prompts${queryString ? `?${queryString}` : ''}`;
    return fetchApi<Prompt[]>(endpoint);
};
export const createPrompt = (data: { title: string; content: string; emoji?: string; folderId?: string | null }): Promise<Prompt> => fetchApi<Prompt>('/prompts', { method: 'POST', body: JSON.stringify(data) });
export const getPromptById = (id: string): Promise<Prompt> => fetchApi<Prompt>(`/prompts/${id}`);
export const updatePrompt = (id: string, data: { title?: string; content?: string; emoji?: string; folderId?: string | null }): Promise<Prompt> => fetchApi<Prompt>(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePrompt = (id: string): Promise<void> => fetchApi<void>(`/prompts/${id}`, { method: 'DELETE' });

// Example usage:
// getFolders().then(folders => console.log(folders));
// createFolder({ name: 'My New Folder' }).then(newFolder => console.log(newFolder)); 
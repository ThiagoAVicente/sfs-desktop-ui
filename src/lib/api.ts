import { invoke } from '@tauri-apps/api/core';

const getApiConfig = () => {
  const stored = localStorage.getItem('sfs-settings');
  const settings = stored ? JSON.parse(stored) : null;
  return {
    baseURL: settings?.apiUrl || 'https://localhost',
    apiKey: settings?.apiKey || '',
  };
};

// Custom fetch wrapper that uses Tauri command to accept self-signed certs
const secureFetch = async (url: string, options: {
  method: string;
  headers: Record<string, string>;
  body?: string;
}) => {
  const response = await invoke<{ ok: boolean; status: number; body: string }>('secure_fetch', {
    url,
    options: {
      method: options.method,
      headers: options.headers,
      body: options.body || null,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    text: async () => response.body,
    json: async () => JSON.parse(response.body),
    blob: async () => new Blob([response.body]),
  };
};

export const api = {
  // Upload and index a file
  uploadFile: async (filePath: string, fileName: string, update: boolean = false) => {
    const config = getApiConfig();

    const response = await invoke<{ ok: boolean; status: number; body: string }>('secure_upload', {
      url: `${config.baseURL}/index`,
      filePath: filePath,
      fileName: fileName,
      apiKey: config.apiKey,
      update,
    });

    if (!response.ok) {
      throw new Error(response.body || 'Upload failed');
    }

    return { data: JSON.parse(response.body) as { job_id: string } };
  },

  // Check indexing job status
  getJobStatus: async (jobId: string) => {
    const config = getApiConfig();

    const response = await secureFetch(`${config.baseURL}/index/status/${jobId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Status check failed');
    }

    return { data: await response.json() as { job_id: string; status: string } };
  },

  // Test connection
  healthCheck: async () => {
    const config = getApiConfig();

    const response = await secureFetch(`${config.baseURL}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return { data: await response.json() };
  },

  // List all files
  listFiles: async (prefix?: string) => {
    const config = getApiConfig();
    const url = new URL(`${config.baseURL}/files/`);
    if (prefix) {
      url.searchParams.append('prefix', prefix);
    }

    const response = await secureFetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    return { data: await response.json() as { files: string[]; count: number } };
  },

  // Download a file
  downloadFile: async (fileName: string) => {
    const config = getApiConfig();

    const response = await secureFetch(`${config.baseURL}/files/${fileName}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return { data: await response.blob() };
  },

  // Delete a file
  deleteFile: async (fileName: string) => {
    const config = getApiConfig();

    const response = await secureFetch(`${config.baseURL}/index/${fileName}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return { data: await response.json() as { job_id: string } };
  },

  // Search
  search: async (query: string, limit: number = 5, scoreThreshold: number = 0.5) => {
    const config = getApiConfig();

    const response = await secureFetch(`${config.baseURL}/search`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        score_threshold: scoreThreshold,
      }),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return { data: await response.json() };
  },
};

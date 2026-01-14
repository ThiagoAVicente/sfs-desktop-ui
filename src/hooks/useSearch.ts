import { useState } from 'react';
import { api } from '../lib/api';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export interface SearchResult {
  score: number;
  payload: {
    file_path: string;
    text: string;
    start: number;
    end: number;
    chunk_index: number;
  };
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const search = async (query: string, limit: number, scoreThreshold: number) => {
    if (!query.trim()) return;

    setSearching(true);
    setError('');
    setResults([]);

    try {
      const response = await api.search(query, limit, scoreThreshold);
      setResults(response.data.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const downloadFile = async (filePath: string, downloadPath?: string) => {
    try {
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'download';
      const response = await api.downloadFile(filePath);

      const savePath = await save({
        defaultPath: downloadPath ? `${downloadPath}/${fileName}` : fileName,
        filters: [{
          name: 'All Files',
          extensions: ['*']
        }]
      });

      if (savePath) {
        const arrayBuffer = await response.data.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await writeFile(savePath, uint8Array);
      }
    } catch (err: any) {
      console.error('Download failed:', err);
      throw err;
    }
  };

  const clearResults = () => {
    setResults([]);
    setError('');
  };

  return {
    results,
    searching,
    error,
    search,
    downloadFile,
    clearResults,
  };
}

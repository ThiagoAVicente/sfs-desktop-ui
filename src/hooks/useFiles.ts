import { useState } from 'react';
import { api } from '../lib/api';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export function useFiles() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadFiles = async (prefix?: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.listFiles(prefix);
      setFiles(response.data.files || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    setDeleting(fileName);
    try {
      await api.deleteFile(fileName);
      setFiles((prev) => prev.filter((f) => f !== fileName));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const downloadFile = async (fileName: string, defaultPath?: string) => {
    setDownloading(fileName);
    try {
      const response = await api.downloadFile(fileName);

      const savePath = await save({
        defaultPath: defaultPath || fileName,
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
    } finally {
      setDownloading(null);
    }
  };

  const filterFiles = (searchQuery: string) => {
    return files.filter((file) =>
      file.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return {
    files,
    loading,
    error,
    deleting,
    downloading,
    loadFiles,
    deleteFile,
    downloadFile,
    filterFiles,
  };
}

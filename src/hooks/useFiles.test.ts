import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFiles } from './useFiles';
import { api } from '../lib/api';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

// Mock dependencies
vi.mock('../lib/api');
vi.mock('@tauri-apps/plugin-dialog');
vi.mock('@tauri-apps/plugin-fs');

describe('useFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFiles());

    expect(result.current.files).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.deleting).toBeNull();
    expect(result.current.downloading).toBeNull();
  });

  it('should load files successfully', async () => {
    const mockFiles = ['file1.txt', 'file2.pdf', 'file3.md'];

    vi.mocked(api.listFiles).mockResolvedValue({
      data: { files: mockFiles, count: 3 },
    } as any);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.files).toEqual(mockFiles);
      expect(result.current.error).toBe('');
    });

    expect(api.listFiles).toHaveBeenCalledWith(undefined);
  });

  it('should load files with prefix filter', async () => {
    const mockFiles = ['docs_file1.txt', 'docs_file2.txt'];

    vi.mocked(api.listFiles).mockResolvedValue({
      data: { files: mockFiles, count: 2 },
    } as any);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles('docs_');
    });

    expect(api.listFiles).toHaveBeenCalledWith('docs_');
    expect(result.current.files).toEqual(mockFiles);
  });

  it('should handle load errors', async () => {
    const error = new Error('Failed to load files');
    vi.mocked(api.listFiles).mockRejectedValue(error);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load files');
      expect(result.current.files).toEqual([]);
    });
  });

  it('should set loading state during load', async () => {
    let resolveLoad: any;
    const loadPromise = new Promise((resolve) => {
      resolveLoad = resolve;
    });

    vi.mocked(api.listFiles).mockReturnValue(loadPromise as any);

    const { result } = renderHook(() => useFiles());

    act(() => {
      result.current.loadFiles();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    act(() => {
      resolveLoad({ data: { files: [], count: 0 } });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should delete file successfully', async () => {
    vi.mocked(api.listFiles).mockResolvedValue({
      data: { files: ['file1.txt', 'file2.txt', 'file3.txt'], count: 3 },
    } as any);

    vi.mocked(api.deleteFile).mockResolvedValue({
      data: { job_id: 'job-123' },
    } as any);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles();
    });

    await act(async () => {
      await result.current.deleteFile('file2.txt');
    });

    await waitFor(() => {
      expect(result.current.files).toEqual(['file1.txt', 'file3.txt']);
      expect(result.current.deleting).toBeNull();
    });

    expect(api.deleteFile).toHaveBeenCalledWith('file2.txt');
  });

  it('should set deleting state during delete', async () => {
    let resolveDelete: any;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });

    vi.mocked(api.deleteFile).mockReturnValue(deletePromise as any);

    const { result } = renderHook(() => useFiles());

    act(() => {
      result.current.deleteFile('file.txt');
    });

    await waitFor(() => {
      expect(result.current.deleting).toBe('file.txt');
    });

    act(() => {
      resolveDelete({ data: { job_id: 'job-123' } });
    });

    await waitFor(() => {
      expect(result.current.deleting).toBeNull();
    });
  });

  it('should handle delete errors', async () => {
    const error = new Error('Delete failed');
    vi.mocked(api.deleteFile).mockRejectedValue(error);

    const { result } = renderHook(() => useFiles());

    await expect(async () => {
      await act(async () => {
        await result.current.deleteFile('file.txt');
      });
    }).rejects.toThrow('Delete failed');

    expect(result.current.deleting).toBeNull();
  });

  it('should download file successfully', async () => {
    const mockArrayBuffer = new ArrayBuffer(12);

    vi.mocked(api.downloadFile).mockResolvedValue({
      data: {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      },
    } as any);

    vi.mocked(save).mockResolvedValue('/save/path/file.txt');
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.downloadFile('file.txt');
    });

    expect(api.downloadFile).toHaveBeenCalledWith('file.txt');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: 'file.txt',
      })
    );
    expect(writeFile).toHaveBeenCalled();
    expect(result.current.downloading).toBeNull();
  });

  it('should download file with custom default path', async () => {
    const mockArrayBuffer = new ArrayBuffer(12);

    vi.mocked(api.downloadFile).mockResolvedValue({
      data: {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      },
    } as any);

    vi.mocked(save).mockResolvedValue('/custom/path/file.txt');

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.downloadFile('file.txt', '/custom/path/file.txt');
    });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: '/custom/path/file.txt',
      })
    );
  });

  it('should set downloading state during download', async () => {
    let resolveDownload: any;
    const downloadPromise = new Promise((resolve) => {
      resolveDownload = resolve;
    });

    vi.mocked(api.downloadFile).mockReturnValue(downloadPromise as any);

    const { result } = renderHook(() => useFiles());

    act(() => {
      result.current.downloadFile('file.txt');
    });

    await waitFor(() => {
      expect(result.current.downloading).toBe('file.txt');
    });

    act(() => {
      resolveDownload({
        data: {
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(12)),
        },
      });
    });

    vi.mocked(save).mockResolvedValue(null);

    await waitFor(() => {
      expect(result.current.downloading).toBeNull();
    });
  });

  it('should not write file if user cancels save dialog', async () => {
    const mockArrayBuffer = new ArrayBuffer(12);

    vi.mocked(api.downloadFile).mockResolvedValue({
      data: {
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      },
    } as any);

    vi.mocked(save).mockResolvedValue(null);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.downloadFile('file.txt');
    });

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('should handle download errors', async () => {
    const error = new Error('Download failed');
    vi.mocked(api.downloadFile).mockRejectedValue(error);

    const { result } = renderHook(() => useFiles());

    await expect(async () => {
      await act(async () => {
        await result.current.downloadFile('file.txt');
      });
    }).rejects.toThrow('Download failed');

    expect(result.current.downloading).toBeNull();
  });

  it('should filter files by search query', async () => {
    vi.mocked(api.listFiles).mockResolvedValue({
      data: { files: ['test1.txt', 'document.pdf', 'test2.md'], count: 3 },
    } as any);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles();
    });

    const filtered = result.current.filterFiles('test');
    expect(filtered).toEqual(['test1.txt', 'test2.md']);
  });

  it('should filter files case-insensitively', async () => {
    vi.mocked(api.listFiles).mockResolvedValue({
      data: { files: ['TEST.txt', 'Document.pdf', 'test.md'], count: 3 },
    } as any);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles();
    });

    const filtered = result.current.filterFiles('test');
    expect(filtered).toEqual(['TEST.txt', 'test.md']);
  });

  it('should return all files when filter is empty', async () => {
    const allFiles = ['file1.txt', 'file2.pdf', 'file3.md'];

    vi.mocked(api.listFiles).mockResolvedValue({
      data: { files: allFiles, count: 3 },
    } as any);

    const { result } = renderHook(() => useFiles());

    await act(async () => {
      await result.current.loadFiles();
    });

    const filtered = result.current.filterFiles('');
    expect(filtered).toEqual(allFiles);
  });
});

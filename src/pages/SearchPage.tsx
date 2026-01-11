import { useState } from 'react';
import { api } from '../lib/api';
import { useSettingsStore } from '../stores/settingsStore';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

interface SearchResult {
  score: number;
  payload: {
    file_path: string;
    text: string;
    start: number;
    end: number;
    chunk_index: number;
  };
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5);
  const [scoreThreshold, setScoreThreshold] = useState(0.5);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const downloadPath = useSettingsStore((state) => state.downloadPath);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDownload = async (filePath: string) => {
    try {
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'download';
      const response = await api.downloadFile(filePath);

      // Ask user where to save
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
    }
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Search
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Search your indexed files
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter your search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Max Results: {limit}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Score Threshold: {scoreThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="w-full px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Results ({results.length})
              </h2>
            </div>

            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg"
              >
                <p className="text-neutral-900 dark:text-white mb-3 leading-relaxed whitespace-pre-wrap">
                  {result.payload.text}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400">
                    <span className="font-mono">{result.payload.file_path}</span>
                    <span>Position: {result.payload.start}-{result.payload.end}</span>
                    <span>Score: {result.score.toFixed(3)}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(result.payload.file_path)}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!searching && results.length === 0 && query && !error && (
          <div className="mt-8 text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
}

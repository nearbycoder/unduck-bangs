import React, { useState, useEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { SearchItem } from './types';

function App() {
  const [searchData, setSearchData] = useState<SearchItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || '';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const listRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const PADDING = 48;
  const availableWidth = Math.min(1920, windowSize.width - PADDING);
  const isMobile = availableWidth < 768; // Standard tablet breakpoint
  const columnWidth = isMobile
    ? availableWidth
    : Math.min(500, availableWidth / 2);
  const columnCount = isMobile
    ? 1
    : Math.max(1, Math.floor(availableWidth / columnWidth));
  const rowHeight = 160;

  const filteredData = searchData.filter((item) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.s.toLowerCase().includes(searchTermLower) ||
      item.d.toLowerCase().includes(searchTermLower) ||
      item.t.toLowerCase().includes(searchTermLower) ||
      ('!' + item.t).toLowerCase().includes(searchTermLower);

    if (selectedCategory === 'Popular') {
      return matchesSearch && item.t.length === 1;
    }

    return matchesSearch && (!selectedCategory || item.c === selectedCategory);
  });

  const rowCount = Math.ceil(filteredData.length / columnCount);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const columnVirtualizer = useWindowVirtualizer({
    horizontal: true,
    count: columnCount,
    estimateSize: () => columnWidth,
    overscan: 2,
    scrollMargin: listRef.current?.offsetLeft ?? 0,
  });

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(
      searchData.map((item) => item.c).filter(Boolean)
    );
    // Only add Popular category if we have search data
    if (searchData.length > 0) {
      uniqueCategories.add('Popular');
    }
    return Array.from(uniqueCategories);
  }, [searchData]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    fetch('https://tall-lion-44.deno.dev')
      .then((response) => response.json())
      .then((data) => setSearchData(data.data))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    // Update document class when isDarkMode changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const updateUrlParams = (newTerm?: string, newCategory?: string) => {
    const params = new URLSearchParams(window.location.search);

    if (newTerm !== undefined) {
      if (newTerm) {
        params.set('q', newTerm);
      } else {
        params.delete('q');
      }
    }

    if (newCategory !== undefined) {
      if (newCategory) {
        params.set('category', newCategory);
      } else {
        params.delete('category');
      }
    }

    const newUrl = `${window.location.pathname}${
      params.toString() ? '?' + params.toString() : ''
    }`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    updateUrlParams(newTerm, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    updateUrlParams(searchTerm, category === selectedCategory ? '' : category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800">
      <div className="p-6">
        <div className="mb-8 text-center">
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 
                       hover:bg-stone-200 dark:hover:bg-stone-700
                       border border-stone-200 dark:border-stone-700"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-4">
            Unduck.link Search Directory
          </h1>

          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-stone-400 dark:text-stone-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              placeholder="Search by name, domain, or shortcut..."
              className="w-full pl-10 pr-4 py-3 rounded-lg 
                       bg-white dark:bg-stone-900 
                       text-stone-900 dark:text-white
                       placeholder-stone-500 dark:placeholder-stone-400
                       border border-stone-200 dark:border-stone-700 
                       focus:border-blue-500 dark:focus:border-blue-400 
                       focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            use with{' '}
            <code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
              https://unduck.link/?q=%s
            </code>{' '}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white dark:bg-blue-600'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                  }
                  border border-stone-200 dark:border-stone-700`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center">
          <div className="w-full max-w-[1920px] mx-auto flex justify-center">
            <div ref={listRef} className="overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: `${columnVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                  <React.Fragment key={virtualRow.key}>
                    {columnVirtualizer
                      .getVirtualItems()
                      .map((virtualColumn) => {
                        const itemIndex =
                          virtualRow.index * columnCount + virtualColumn.index;
                        const item = filteredData[itemIndex];

                        if (!item || isLoading) return null;

                        return (
                          <div
                            key={`${virtualRow.key}-${virtualColumn.key}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: `${columnWidth}px`,
                              height: `${rowHeight}px`,
                              transform: `translateX(${
                                virtualColumn.start -
                                columnVirtualizer.options.scrollMargin
                              }px) translateY(${
                                virtualRow.start -
                                rowVirtualizer.options.scrollMargin
                              }px)`,
                            }}
                          >
                            <div
                              className="m-2 bg-white dark:bg-stone-900 rounded-lg shadow-md dark:shadow-stone-900 
                                    p-6 hover:shadow-lg transition-shadow border border-stone-200 dark:border-stone-700"
                            >
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  {item.d && (
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${item.d}&sz=64`}
                                      alt={`${item.s} favicon`}
                                      className="w-8 h-8"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="2" y1="12" x2="22" y2="12"/%3E%3Cpath d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/%3E%3C/svg%3E';
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-1 truncate">
                                    {item.s}
                                  </h2>
                                  <div className="flex items-center text-stone-700 dark:text-stone-300 mb-2">
                                    <span className="truncate">{item.d}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/50 
                                            text-blue-700 dark:text-blue-200 rounded-md text-sm"
                                    >
                                      !{item.t}
                                    </span>
                                    {item.c && (
                                      <span
                                        className="px-2 py-1 bg-stone-50 dark:bg-stone-800 
                                              text-stone-700 dark:text-stone-300 rounded-md text-sm"
                                      >
                                        {item.c}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

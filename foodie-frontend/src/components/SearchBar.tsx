'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export default function SearchBar({ placeholder = 'Search by cuisine, location, or chef name...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-4 flex items-center text-muted">
        <Search className="h-5 w-5" />
      </div>
      <input
        type="search"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full bg-surface-elevated/70 border border-surface rounded-full py-4 pl-14 pr-6 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-transparent transition"
        placeholder={placeholder}
      />
    </div>
  );
}

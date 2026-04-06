'use client'

import React, { useEffect, useState } from 'react';

type Option = { id: number; label: string };

interface Props {
  value?: number | null;
  onChange: (id: number | null) => void;
  fetchOptions: (q?: string) => Promise<Option[]>;
  createOption?: (label: string) => Promise<Option>;
  placeholder?: string;
}

export const CreatableCombobox: React.FC<Props> = ({ value, onChange, fetchOptions, createOption, placeholder }) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchOptions(query || undefined);
        if (!mounted) return;
        setOptions(items || []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false };
  }, [query, fetchOptions]);

  const handleSelect = (opt: Option) => {
    setQuery(opt.label);
    setOpen(false);
    onChange(opt.id);
  };

  const handleCreate = async () => {
    if (!createOption) return;
    const newLabel = query.trim();
    if (!newLabel) return;
    const created = await createOption(newLabel);
    if (created) {
      setOptions((s) => [created, ...s]);
      handleSelect(created);
    }
  };

  return (
    <div className="relative">
      <input
        className="w-full border rounded px-2 py-1"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); onChange(null); }}
      />
      {open && (
        <div className="absolute z-20 bg-white border rounded mt-1 w-full max-h-56 overflow-auto">
          {options.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No matches</div>
          )}
          {options.map((o) => (
            <div key={o.id} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => handleSelect(o)}>
              {o.label}
            </div>
          ))}
          {createOption && query.trim() && !options.find((o) => o.label.toLowerCase() === query.trim().toLowerCase()) && (
            <div className="p-2 border-t">
              <button type="button" className="text-sm text-blue-600" onMouseDown={handleCreate}>
                Create "{query.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableCombobox;

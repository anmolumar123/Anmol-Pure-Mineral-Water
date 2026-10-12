import React, { useState, useRef, useEffect, useMemo } from 'react';
import { KARACHI_AREAS, CUSTOM_AREA_OPTION } from '../../utils/karachiAreas';
import { Search, ChevronDown, Check, MapPin, PlusCircle, X } from 'lucide-react';

interface KarachiAreaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  showCustomOption?: boolean;
}

export const KarachiAreaSelector: React.FC<KarachiAreaSelectorProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'Select Karachi Area / Sector...',
  showCustomOption = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // If the passed value isn't in KARACHI_AREAS and is not empty, it's a custom area
  useEffect(() => {
    if (value && !KARACHI_AREAS.includes(value)) {
      setIsCustomMode(true);
      setCustomAreaInput(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAreas = useMemo(() => {
    if (!searchTerm.trim()) return KARACHI_AREAS;
    const term = searchTerm.toLowerCase();
    return KARACHI_AREAS.filter((area) => area.toLowerCase().includes(term));
  }, [searchTerm]);

  const handleSelect = (area: string) => {
    if (area === CUSTOM_AREA_OPTION) {
      setIsCustomMode(true);
      setIsOpen(false);
      return;
    }
    setIsCustomMode(false);
    onChange(area);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCustomSubmit = () => {
    if (customAreaInput.trim()) {
      onChange(customAreaInput.trim());
      setIsCustomMode(false);
    }
  };

  if (isCustomMode) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1 text-blue-600">
            <PlusCircle className="w-3.5 h-3.5" />
            Custom Area Name
          </span>
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              onChange('');
            }}
            className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
          >
            Choose from predefined list
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            required={required}
            value={customAreaInput}
            onChange={(e) => {
              setCustomAreaInput(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="Type specific street, sector, or phase..."
            className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm cursor-pointer hover:border-slate-300 transition-colors focus:ring-2 focus:ring-blue-500/20"
      >
        <span className="flex items-center gap-2 truncate text-slate-700">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          {value || <span className="text-slate-400">{placeholder}</span>}
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          {value && (
            <X
              className="w-4 h-4 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search area (e.g. DHA, Gulshan, Clifton)..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 text-xs sm:text-sm">
            {filteredAreas.length > 0 ? (
              filteredAreas.map((area) => (
                <div
                  key={area}
                  onClick={() => handleSelect(area)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50/70 hover:text-blue-700 transition-colors ${
                    value === area ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span>{area}</span>
                  {value === area && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">No areas found.</div>
            )}

            {showCustomOption && (
              <div
                onClick={() => handleSelect(CUSTOM_AREA_OPTION)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold cursor-pointer border-t border-slate-100"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Custom / Unlisted Location</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

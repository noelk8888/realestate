import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { DualRangeSlider } from './components/DualRangeSlider';
import { fetchListings } from './services/dataService';
import { searchListings } from './services/searchEngine';
import type { Listing } from './types';
import { ListingCard } from './components/ListingCard';
import { ContactFormModal } from './components/ContactFormModal';
import { ScrollToTop } from './components/ScrollToTop';

function App() {

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [results, setResults] = useState<Listing[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>('Sale'); // Default 'Sale'
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 'Residential' | 'Commercial' | 'Agricultural' | null
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Price Range State
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const [isPricePerSqmFilterOpen, setIsPricePerSqmFilterOpen] = useState(false);
  const [pricePerSqmRange, setPricePerSqmRange] = useState<[number, number] | null>(null);

  const [isLotAreaFilterOpen, setIsLotAreaFilterOpen] = useState(false);
  const [lotAreaRange, setLotAreaRange] = useState<[number, number] | null>(null);

  const [isFloorAreaFilterOpen, setIsFloorAreaFilterOpen] = useState(false);
  const [floorAreaRange, setFloorAreaRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Reset selections on search
    if (query) {
      setSelectedListings([]);
      setIsPriceFilterOpen(false);
      setPriceRange(null);
      setIsPricePerSqmFilterOpen(false);
      setPricePerSqmRange(null);
      setIsLotAreaFilterOpen(false);
      setLotAreaRange(null);
      setIsFloorAreaFilterOpen(false);
      setFloorAreaRange(null);
    }
  }, [query]);

  // Click-outside handler for Price Popover
  const pricePopoverRef = useRef<HTMLDivElement>(null);
  const priceButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Click-outside handler for Price/Sqm Popover
  const pricePerSqmPopoverRef = useRef<HTMLDivElement>(null);
  const pricePerSqmButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPositionPerSqm, setPopoverPositionPerSqm] = useState({ top: 0, left: 0 });

  // Click-outside handler for Lot Area Popover
  const lotAreaPopoverRef = useRef<HTMLDivElement>(null);
  const lotAreaButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPositionLot, setPopoverPositionLot] = useState({ top: 0, left: 0 });

  // Click-outside handler for Floor Area Popover
  const floorAreaPopoverRef = useRef<HTMLDivElement>(null);
  const floorAreaButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverPositionFloor, setPopoverPositionFloor] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isPriceFilterOpen && priceButtonRef.current) {
      const rect = priceButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isPriceFilterOpen, sortConfig]);

  useEffect(() => {
    if (isPricePerSqmFilterOpen && pricePerSqmButtonRef.current) {
      const rect = pricePerSqmButtonRef.current.getBoundingClientRect();
      setPopoverPositionPerSqm({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isPricePerSqmFilterOpen, sortConfig]);

  useEffect(() => {
    if (isLotAreaFilterOpen && lotAreaButtonRef.current) {
      const rect = lotAreaButtonRef.current.getBoundingClientRect();
      setPopoverPositionLot({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isLotAreaFilterOpen, sortConfig]);

  useEffect(() => {
    if (isFloorAreaFilterOpen && floorAreaButtonRef.current) {
      const rect = floorAreaButtonRef.current.getBoundingClientRect();
      setPopoverPositionFloor({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isFloorAreaFilterOpen, sortConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close Price Popover
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(event.target as Node)) {
        setIsPriceFilterOpen(false);
      }
      // Close Price/Sqm Popover
      if (pricePerSqmPopoverRef.current && !pricePerSqmPopoverRef.current.contains(event.target as Node)) {
        setIsPricePerSqmFilterOpen(false);
      }
      // Close Lot Area Popover
      if (lotAreaPopoverRef.current && !lotAreaPopoverRef.current.contains(event.target as Node)) {
        setIsLotAreaFilterOpen(false);
      }
      // Close Floor Area Popover
      if (floorAreaPopoverRef.current && !floorAreaPopoverRef.current.contains(event.target as Node)) {
        setIsFloorAreaFilterOpen(false);
      }
    };

    if (isPriceFilterOpen || isPricePerSqmFilterOpen || isLotAreaFilterOpen || isFloorAreaFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPriceFilterOpen, isPricePerSqmFilterOpen, isLotAreaFilterOpen, isFloorAreaFilterOpen]);
  // Relevance Score: 0-100.
  // We align this with the 5 stages requested: 100, 75, 50, 25, 0.
  // Initialize from URL if present.
  const getInitialScore = () => {
    const params = new URLSearchParams(window.location.search);
    const score = params.get('relevance');
    return score ? parseInt(score) : 50; // Default 50
  };

  const [relevanceScore, setRelevanceScore] = useState<number>(getInitialScore());
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);

  // Dynamic Placeholder Text
  const [placeholderText, setPlaceholderText] = useState('Ready. Try "Lot in Caloocan"');
  useEffect(() => {
    const examples = [
      "Lot in Quezon City",
      "Condo in Makati",
      "Office Space in Ortigas",
      "Warehouse in Paranaque",
      "Lot in Caloocan",
      "BGC Condo"
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % examples.length;
      setPlaceholderText(`Ready. Try "${examples[index]}"`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Initial Data Load
  useEffect(() => {
    fetchListings().then(data => {
      setAllListings(data);
      setLoading(false);
    });
  }, []);

  // Post-load search if URL had query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!loading && q && !hasSearched) {
      setHasSearched(true);
      setQuery(q);
      let filtered = searchListings(allListings, q, relevanceScore);
      setResults(filtered);
    }
  }, [loading, allListings, hasSearched, relevanceScore]);

  const updateUrlParams = (q: string, score: number) => {
    const params = new URLSearchParams(window.location.search);
    if (q) params.set('q', q);
    else params.delete('q');

    params.set('relevance', score.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    updateUrlParams(query, relevanceScore);

    let filtered = searchListings(allListings, query, relevanceScore);
    setResults(filtered);
  };

  // Effect: Re-search when relevanceScore changes
  useEffect(() => {
    if (hasSearched && query.trim()) {
      updateUrlParams(query, relevanceScore);
      let filtered = searchListings(allListings, query, relevanceScore);
      setResults(filtered);
    }
  }, [relevanceScore]); // Trigger re-search on score change

  // Re-run filter and sort when filters change
  const baseFilteredResults = results.filter(item => {
    // 0. ID Search Override
    // If the query looks like an ID (G+Number), we IGNORE all filters to ensure the specific item is shown.
    const isIdSearch = query.trim().toUpperCase().match(/^G\d+/);

    if (isIdSearch) {
      return true;
    }

    // 1. Type Match Logic (If null, allow all types)
    let typeMatch = true;
    if (selectedType) {
      const itemType = item.saleType?.toLowerCase() || '';
      if (selectedType === 'Sale') typeMatch = (itemType === 'sale' || itemType === 'sale/lease' || itemType === 'sale or lease');
      else if (selectedType === 'Lease') typeMatch = (itemType === 'lease' || itemType === 'sale/lease' || itemType === 'sale or lease');
      else if (selectedType === 'Sale/Lease') {
        typeMatch = itemType.includes('sale') && itemType.includes('lease');
        if (!typeMatch) typeMatch = itemType === 'sale or lease' || itemType === 'sale/lease';
      }
    }

    // 2. Category Match Logic (Single Select)
    let categoryMatch = true;
    if (selectedCategory) {
      const itemCat = (item.category || '').trim().toLowerCase();
      const itemAE = (item.columnAE || '').trim().toLowerCase();

      if (selectedCategory === 'Residential') {
        categoryMatch = itemCat === 'residential' || itemAE === 'residential';
      } else if (selectedCategory === 'Commercial') {
        const targets = ['industrial', 'commercial', 'industrial/commercial'];
        categoryMatch = targets.includes(itemCat) || targets.includes(itemAE);
      } else if (selectedCategory === 'Agricultural') {
        categoryMatch = itemCat === 'agricultural';
      }
    }

    return typeMatch && categoryMatch;
  });

  // Derived Min/Max from BASE results (for Slider limits)
  const availablePrices = baseFilteredResults.map(i => i.price).filter(p => p > 0);

  // Helper function to determine step size based on value magnitude
  const getStepSize = (value: number): number => {
    if (value >= 1000000) return 1000000;    // 1M for values >= 1 million
    if (value >= 1000) return 10000;         // 10K for values >= 1 thousand
    return 10;                                // 10 for values < 1 thousand
  };

  // Calculate raw min/max
  const rawMin = availablePrices.length ? Math.min(...availablePrices) : 0;
  const rawMax = availablePrices.length ? Math.max(...availablePrices) : 1000000;

  // Round min DOWN and max UP based on their respective step sizes
  const minStep = getStepSize(rawMin);
  const maxStep = getStepSize(rawMax);
  const minGlob = Math.floor(rawMin / minStep) * minStep;
  const maxGlob = Math.ceil(rawMax / maxStep) * maxStep;

  // Use the smaller step for slider granularity
  const sliderStep = Math.min(minStep, maxStep);


  // Derived Min/Max for Price/Sqm
  const availablePricePerSqm = baseFilteredResults.map(i => i.pricePerSqm).filter(p => p > 0);
  const rawMinPerSqm = availablePricePerSqm.length ? Math.min(...availablePricePerSqm) : 0;
  const rawMaxPerSqm = availablePricePerSqm.length ? Math.max(...availablePricePerSqm) : 10000;

  const minStepPerSqm = getStepSize(rawMinPerSqm);
  const maxStepPerSqm = getStepSize(rawMaxPerSqm);
  const minGlobPerSqm = Math.floor(rawMinPerSqm / minStepPerSqm) * minStepPerSqm;
  const maxGlobPerSqm = Math.ceil(rawMaxPerSqm / maxStepPerSqm) * maxStepPerSqm;

  const sliderStepPerSqm = Math.min(minStepPerSqm, maxStepPerSqm);


  // Derived Min/Max for Lot Area
  const availableLotArea = baseFilteredResults.map(i => i.lotArea).filter(p => p >= 0);
  const rawMinLot = availableLotArea.length ? Math.min(...availableLotArea) : 0;
  // Fallback max if empty? 1000? 
  const rawMaxLot = availableLotArea.length ? Math.max(...availableLotArea) : 1000;

  const minStepLot = getStepSize(rawMinLot);
  const maxStepLot = getStepSize(rawMaxLot);
  const minGlobLot = Math.floor(rawMinLot / minStepLot) * minStepLot;
  const maxGlobLot = Math.ceil(rawMaxLot / maxStepLot) * maxStepLot;
  const sliderStepLot = Math.min(minStepLot, maxStepLot);


  // Derived Min/Max for Floor Area
  const availableFloorArea = baseFilteredResults.map(i => i.floorArea).filter(p => p > 0);
  const rawMinFloor = availableFloorArea.length ? Math.min(...availableFloorArea) : 0;
  const rawMaxFloor = availableFloorArea.length ? Math.max(...availableFloorArea) : 1000;

  const minStepFloor = getStepSize(rawMinFloor);
  const maxStepFloor = getStepSize(rawMaxFloor);
  const minGlobFloor = Math.floor(rawMinFloor / minStepFloor) * minStepFloor;
  const maxGlobFloor = Math.ceil(rawMaxFloor / maxStepFloor) * maxStepFloor;
  const sliderStepFloor = Math.min(minStepFloor, maxStepFloor);


  // Final Results (Apply Price and Price/Sqm Range)
  const displayedResults = baseFilteredResults.filter(item => {
    // Filter by Price Range
    if (priceRange) {
      if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
    }
    // Filter by Price/Sqm Range
    if (pricePerSqmRange) {
      if (item.pricePerSqm < pricePerSqmRange[0] || item.pricePerSqm > pricePerSqmRange[1]) return false;
    }
    // Filter by Lot Area Range
    if (lotAreaRange) {
      if (item.lotArea < lotAreaRange[0] || item.lotArea > lotAreaRange[1]) return false;
    }
    // Filter by Floor Area Range
    if (floorAreaRange) {
      if (item.floorArea < floorAreaRange[0] || item.floorArea > floorAreaRange[1]) return false;
    }
    return true;
  }).sort((a, b) => {
    if (!sortConfig) return 0;

    let comparison = 0;
    if (sortConfig.key === 'price') {
      comparison = a.price - b.price;
    } else if (sortConfig.key === 'pricePerSqm') {
      comparison = a.pricePerSqm - b.pricePerSqm;
    } else if (sortConfig.key === 'lotArea') {
      comparison = a.lotArea - b.lotArea;
    } else if (sortConfig.key === 'floorArea') {
      comparison = a.floorArea - b.floorArea;
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Relevance sort = null sortConfig (uses original array order from searchEngine)
  const handleSort = (key: 'price' | 'pricePerSqm' | 'relevance' | 'lotArea' | 'floorArea') => {
    if (key === 'relevance') {
      setSortConfig(null);
      setIsPriceFilterOpen(false); // Close price popover
      setIsPricePerSqmFilterOpen(false); // Close price/sqm popover
      return;
    }

    // Close popovers if sorting by non-corresponding fields
    if (key !== 'price') {
      setIsPriceFilterOpen(false);
    }
    if (key !== 'pricePerSqm') {
      setIsPricePerSqmFilterOpen(false);
    }
    if (key !== 'lotArea') {
      setIsLotAreaFilterOpen(false);
    }
    if (key !== 'floorArea') {
      setIsFloorAreaFilterOpen(false);
    }

    setSortConfig(current => {
      if (current?.key === key) {
        // Toggle direction if same key
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Default to High-Low (desc) for new key as implies "Best/Expensive" first usually
      return { key, direction: 'desc' };
    });
  };

  const handleToggleSelection = (listingId: string) => {
    setSelectedListings(prev => {
      if (prev.includes(listingId)) {
        // Deselect
        return prev.filter(id => id !== listingId);
      } else {
        // Select (only if less than 5)
        if (prev.length < 5) {
          return [...prev, listingId];
        }
        return prev;
      }
    });
  };

  const handleSendForm = () => {
    setShowFormModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <ScrollToTop />

      {/* Hero / Search Section */}
      <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-out px-4 ${hasSearched ? 'py-12 min-h-[30vh]' : 'min-h-[100vh]'
        }`}>
        <div className={`w-full max-w-2xl text-center space-y-6 transition-all duration-500 ${hasSearched ? 'translate-y-0' : '-translate-y-8'
          }`}>
          <p className={`font-bold text-gray-900 tracking-tight transition-all duration-500 ${hasSearched ? 'text-2xl mb-4' : 'text-4xl sm:text-5xl mb-8'}`}>
            {(selectedType || hasSearched)
              ? `Found ${displayedResults.length} of ${allListings.length} Available Listings`
              : allListings.length > 0 ? `${allListings.length} Available Listings` : 'Loading properties...'
            }
          </p>



          {/* Filter Buttons - Single Line Compact Layout */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1 mb-8 w-full max-w-6xl mx-auto px-1">

            {/* Group 1: Property Type */}
            <div className="inline-flex bg-gray-100 p-0.5 rounded-lg shadow-inner relative z-0">
              {['Sale', 'Lease', 'Sale/Lease'].map((filter) => {
                let label = filter.toUpperCase();
                if (filter === 'Sale') label = 'SALE'; // Shortened
                if (filter === 'Lease') label = 'LEASE'; // Shortened
                if (filter === 'Sale/Lease') label = 'SALE OR LEASE';

                const isActive = selectedType === filter;

                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedType(current => current === filter ? null : filter)}
                    className={`relative px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-200 min-w-[50px] whitespace-nowrap
                          ${isActive
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 z-10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                      }
                    `}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Spacer - minimal */}
            <div className="w-0.5"></div>

            {/* Group 2: Category */}
            <div className="inline-flex bg-gray-100 p-0.5 rounded-lg shadow-inner relative z-0">
              {['Residential', 'Commercial', 'Agricultural'].map((filter) => {
                const isActive = selectedCategory === filter;
                let label = filter.toUpperCase();
                if (filter === 'Agricultural') label = 'AGRI'; // Short label

                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedCategory(current => current === filter ? null : filter)}
                    className={`relative px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-200 min-w-[60px] whitespace-nowrap
                          ${isActive
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 z-10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                      }
                    `}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

          </div>

          <form onSubmit={handleSearch} className="relative w-full group">
            <div className="absolute inset-y-0 left-2 flex items-center">
              <div className="bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm" onClick={handleSearch}>
                <Search className="w-5 h-5 text-white" />
              </div>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholderText}
              className={`w-full bg-white border-2 transition-all duration-300 rounded-2xl outline-none text-lg
                        ${hasSearched
                  ? 'py-3 pl-14 pr-20 border-gray-200 focus:border-blue-500 shadow-sm'
                  : 'py-4 pl-14 pr-20 border-transparent shadow-xl hover:shadow-2xl focus:ring-4 focus:ring-blue-100'
                }
                    `}
            />
            {/* RESET Button inside Search Bar */}
            {(hasSearched || selectedType) && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedListings([]);
                    setHasSearched(false);
                    setResults([]);
                    setSelectedType(null);
                    setSelectedCategory(null);
                    window.location.href = window.location.pathname;
                  }}
                  className="text-sm font-bold text-red-500 hover:text-red-700 underline tracking-wide bg-white pl-2"
                >
                  RESET
                </button>
              </div>
            )}
          </form>

          {/* Results Bar: Sort Controls Only (Centered below search) */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6 animate-fade-in-up w-full">
            {/* Relevance Slider */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center leading-none select-none">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 uppercase tracking-wide">Exact</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 uppercase tracking-wide">Match</span>
              </div>

              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={(100 - relevanceScore) / 25}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  const newScore = 100 - (index * 25);
                  setRelevanceScore(newScore);
                }}
                className="w-24 sm:w-28 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mx-2"
              />

              <div className="flex flex-col items-center leading-none select-none">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 uppercase tracking-wide">Broad</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 uppercase tracking-wide">Match</span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

            {/* Sort Buttons */}
            <div className="flex gap-2 bg-white p-1 rounded-full border border-gray-100 shadow-sm relative group-sort-controls">
              <div className="relative">
                <button
                  ref={priceButtonRef}
                  onClick={() => {
                    if (sortConfig && sortConfig.key !== 'price') {
                      setSortConfig(null);
                    }
                    setIsPriceFilterOpen(!isPriceFilterOpen);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap
                        ${sortConfig?.key === 'price'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }
                    `}
                >
                  Price
                  {sortConfig?.key === 'price' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </button>

                {isPriceFilterOpen && createPortal(
                  <div
                    ref={pricePopoverRef}
                    className="fixed w-72 bg-blue-50 rounded-xl shadow-2xl p-3 border border-blue-200 z-[9999] animate-fade-in-up"
                    style={{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-900">Price Range (PHP)</span>
                      <button
                        onClick={() => handleSort('price')}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        title="Toggle Sort Order"
                      >
                        {sortConfig?.key === 'price' && sortConfig.direction === 'asc'
                          ? <ArrowUp className="w-4 h-4 text-gray-700" />
                          : <ArrowDown className="w-4 h-4 text-gray-700" />
                        }
                      </button>
                    </div>

                    <DualRangeSlider
                      min={minGlob}
                      max={maxGlob}
                      step={sliderStep}
                      value={priceRange || [minGlob, maxGlob]}
                      onChange={(val) => setPriceRange(val)}
                      formatMinValue={(val) => {
                        if (val >= 1000000) {
                          const millions = val / 1000000;
                          const rounded = Math.floor(millions / 10) * 10;
                          return `${rounded.toLocaleString()}M`;
                        } else if (val >= 1000) {
                          const thousands = val / 1000;
                          const rounded = Math.floor(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K`;
                        } else {
                          return `${Math.floor(val / 10) * 10}`;
                        }
                      }}
                      formatMaxValue={(val) => {
                        if (val >= 1000000) {
                          const millions = val / 1000000;
                          const rounded = Math.ceil(millions / 10) * 10;
                          return `${rounded.toLocaleString()}M`;
                        } else if (val >= 1000) {
                          const thousands = val / 1000;
                          const rounded = Math.ceil(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K`;
                        } else {
                          return `${Math.ceil(val / 10) * 10}`;
                        }
                      }}
                    />
                  </div>,
                  document.body
                )}
              </div>

              {/* Price/Sqm Button */}
              <div className="relative">
                <button
                  ref={pricePerSqmButtonRef}
                  onClick={() => {
                    if (sortConfig && sortConfig.key !== 'pricePerSqm') {
                      setSortConfig(null);
                    }
                    setIsPricePerSqmFilterOpen(!isPricePerSqmFilterOpen);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap
                    ${sortConfig?.key === 'pricePerSqm'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }
                `}
                >
                  Price/Sqm
                  {sortConfig?.key === 'pricePerSqm' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </button>

                {isPricePerSqmFilterOpen && createPortal(
                  <div
                    ref={pricePerSqmPopoverRef}
                    className="fixed w-72 bg-blue-50 rounded-xl shadow-2xl p-3 border border-blue-200 z-[9999] animate-fade-in-up"
                    style={{ top: `${popoverPositionPerSqm.top}px`, left: `${popoverPositionPerSqm.left}px` }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-900">Price/Sqm Range</span>
                      <button
                        onClick={() => handleSort('pricePerSqm')}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        title="Toggle Sort Order"
                      >
                        {sortConfig?.key === 'pricePerSqm' && sortConfig.direction === 'asc'
                          ? <ArrowUp className="w-4 h-4 text-gray-700" />
                          : <ArrowDown className="w-4 h-4 text-gray-700" />
                        }
                      </button>
                    </div>

                    <DualRangeSlider
                      min={minGlobPerSqm}
                      max={maxGlobPerSqm}
                      step={sliderStepPerSqm}
                      value={pricePerSqmRange || [minGlobPerSqm, maxGlobPerSqm]}
                      onChange={(val) => setPricePerSqmRange(val)}
                      formatMinValue={(val) => {
                        if (val >= 1000000) {
                          const millions = val / 1000000;
                          const rounded = Math.floor(millions / 10) * 10;
                          return `${rounded.toLocaleString()}M`;
                        } else if (val >= 1000) {
                          const thousands = val / 1000;
                          const rounded = Math.floor(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K`;
                        } else {
                          return `${Math.floor(val / 10) * 10}`;
                        }
                      }}
                      formatMaxValue={(val) => {
                        if (val >= 1000000) {
                          const millions = val / 1000000;
                          const rounded = Math.ceil(millions / 10) * 10;
                          return `${rounded.toLocaleString()}M`;
                        } else if (val >= 1000) {
                          const thousands = val / 1000;
                          const rounded = Math.ceil(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K`;
                        } else {
                          return `${Math.ceil(val / 10) * 10}`;
                        }
                      }}
                    />
                  </div>,
                  document.body
                )}
              </div>

              {/* Lot Area Button */}
              <div className="relative">
                <button
                  ref={lotAreaButtonRef}
                  onClick={() => {
                    if (sortConfig && sortConfig.key !== 'lotArea') {
                      setSortConfig(null);
                    }
                    setIsLotAreaFilterOpen(!isLotAreaFilterOpen);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap
                    ${sortConfig?.key === 'lotArea'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }
                `}
                >
                  Lot Area
                  {sortConfig?.key === 'lotArea' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </button>

                {isLotAreaFilterOpen && createPortal(
                  <div
                    ref={lotAreaPopoverRef}
                    className="fixed w-72 bg-blue-50 rounded-xl shadow-2xl p-3 border border-blue-200 z-[9999] animate-fade-in-up"
                    style={{ top: `${popoverPositionLot.top}px`, left: `${popoverPositionLot.left}px` }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-900">Lot Area (SQM)</span>
                      <button
                        onClick={() => handleSort('lotArea')}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        title="Toggle Sort Order"
                      >
                        {sortConfig?.key === 'lotArea' && sortConfig.direction === 'asc'
                          ? <ArrowUp className="w-4 h-4 text-gray-700" />
                          : <ArrowDown className="w-4 h-4 text-gray-700" />
                        }
                      </button>
                    </div>

                    <DualRangeSlider
                      min={minGlobLot}
                      max={maxGlobLot}
                      step={sliderStepLot}
                      value={lotAreaRange || [minGlobLot, maxGlobLot]}
                      onChange={(val) => setLotAreaRange(val)}
                      formatMinValue={(val) => {
                        if (val >= 10000) {
                          const thousands = val / 1000;
                          const rounded = Math.floor(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K SQM`;
                        } else {
                          return `${Math.floor(val / 10) * 10} SQM`;
                        }
                      }}
                      formatMaxValue={(val) => {
                        if (val >= 10000) {
                          const thousands = val / 1000;
                          const rounded = Math.ceil(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K SQM`;
                        } else {
                          return `${Math.ceil(val / 10) * 10} SQM`;
                        }
                      }}
                    />
                  </div>,
                  document.body
                )}
              </div>

              {/* Floor Area Button */}
              <div className="relative">
                <button
                  ref={floorAreaButtonRef}
                  onClick={() => {
                    if (sortConfig && sortConfig.key !== 'floorArea') {
                      setSortConfig(null);
                    }
                    setIsFloorAreaFilterOpen(!isFloorAreaFilterOpen);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap
                    ${sortConfig?.key === 'floorArea'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }
                `}
                >
                  Floor Area
                  {sortConfig?.key === 'floorArea' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </button>

                {isFloorAreaFilterOpen && createPortal(
                  <div
                    ref={floorAreaPopoverRef}
                    className="fixed w-72 bg-blue-50 rounded-xl shadow-2xl p-3 border border-blue-200 z-[9999] animate-fade-in-up"
                    style={{ top: `${popoverPositionFloor.top}px`, left: `${popoverPositionFloor.left}px` }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-900">Floor Area (SQM)</span>
                      <button
                        onClick={() => handleSort('floorArea')}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        title="Toggle Sort Order"
                      >
                        {sortConfig?.key === 'floorArea' && sortConfig.direction === 'asc'
                          ? <ArrowUp className="w-4 h-4 text-gray-700" />
                          : <ArrowDown className="w-4 h-4 text-gray-700" />
                        }
                      </button>
                    </div>

                    <DualRangeSlider
                      min={minGlobFloor}
                      max={maxGlobFloor}
                      step={sliderStepFloor}
                      value={floorAreaRange || [minGlobFloor, maxGlobFloor]}
                      onChange={(val) => setFloorAreaRange(val)}
                      formatMinValue={(val) => {
                        if (val >= 10000) {
                          const thousands = val / 1000;
                          const rounded = Math.floor(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K SQM`;
                        } else {
                          return `${Math.floor(val / 10) * 10} SQM`;
                        }
                      }}
                      formatMaxValue={(val) => {
                        if (val >= 10000) {
                          const thousands = val / 1000;
                          const rounded = Math.ceil(thousands / 10) * 10;
                          return `${rounded.toLocaleString()}K SQM`;
                        } else {
                          return `${Math.ceil(val / 10) * 10} SQM`;
                        }
                      }}
                    />
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Selection Status Bar - Only shows when selections > 0 */}
        {selectedListings.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white shadow-2xl border-4 border-blue-500 rounded-xl px-8 py-4 max-w-3xl flex flex-col items-center">
            <p className="text-base text-gray-700 font-medium text-center">
              You may select up to 5{" "}
              <span className="font-bold text-blue-600">({selectedListings.length}/5 selected)</span>{" "}
              -{" "}
              <button
                onClick={handleSendForm}
                className="font-bold text-red-600 underline hover:text-red-800 transition-colors cursor-pointer ml-1"
              >
                SEND FORM
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">
              Listed details are subject to change without prior notice
            </p>
          </div>
        )}



      </div>

      {/* Results Section */}
      {
        hasSearched && (
          <div className="max-w-7xl mx-auto px-4 pb-20 animate-fade-in-up">


            {displayedResults.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <p className="text-lg">
                  No matches found for "{query}"
                  {selectedType ? ` with type "${selectedType}"` : ''}
                  {selectedCategory ? ` and category "${selectedCategory}"` : ''}
                </p>
                <p className="text-sm mt-2">Try adjusting your price, location, or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedResults.map((listing, idx) => (
                  <ListingCard
                    key={`${listing.id}-${idx}`}
                    listing={listing}
                    isSelected={selectedListings.includes(listing.id)}
                    onToggleSelection={handleToggleSelection}
                    isDisabled={selectedListings.length >= 5}
                  />
                ))}
              </div>
            )}
          </div>
        )
      }

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        selectedListings={selectedListings}
      />
    </div >
  );
}

export default App;

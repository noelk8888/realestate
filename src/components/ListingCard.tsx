import React, { useState, useEffect } from 'react';
import type { Listing } from '../types';
import { MapPin, Building, Maximize, Facebook, ChevronDown, ChevronUp } from 'lucide-react';

interface ListingCardProps {
    listing: Listing;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
    isDisabled?: boolean;
    onNotesClick?: (id: string) => void;
    onMapClick?: (listing: Listing) => void;
    onShowNote?: (note: string, id: string) => void;
    index?: number;
    activeFilter?: string | null;
    isPopupView?: boolean;
    onBack?: () => void;
    backButtonVariant?: 'red' | 'blue' | 'gray';
}

export const ListingCard: React.FC<ListingCardProps> = React.memo(({
    listing,
    isSelected = false,
    isDisabled = false,
    onToggleSelection,
    onNotesClick,
    onMapClick,
    // onShowNote,
    index,
    activeFilter,
    isPopupView = false,
    onBack,
    backButtonVariant = 'blue'
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isColumnKCopied, setIsColumnKCopied] = useState(false);
    const [isColumnBDCopied, setIsColumnBDCopied] = useState(false);

    const [isExpanded, setIsExpanded] = useState(false);

    const formatPrice = (price: number) => {
        const formatted = new Intl.NumberFormat('en-PH', {
            maximumFractionDigits: 0
        }).format(price);
        return `P${formatted}`;
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.summary) {
            navigator.clipboard.writeText(listing.summary);
            setIsCopied(true);
        }
    };

    const handleCopyColumnK = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.columnK) {
            navigator.clipboard.writeText(listing.columnK);
            setIsColumnKCopied(true);
        }
    };

    const handleCopyColumnBD = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.columnBD) {
            navigator.clipboard.writeText(listing.columnBD);
            setIsColumnBDCopied(true);
        }
    };

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    useEffect(() => {
        if (isColumnKCopied) {
            const timer = setTimeout(() => setIsColumnKCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isColumnKCopied]);

    useEffect(() => {
        if (isColumnBDCopied) {
            const timer = setTimeout(() => setIsColumnBDCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isColumnBDCopied]);

    const isNotAvailable = listing.statusAQ && listing.statusAQ.toLowerCase().trim() !== 'available';
    // Removed red outline per user request: "UPDATE - no red outline on all NOT AVAILABLE situations"
    const isSponsored = listing.isSponsored;

    return (
        <div
            onClick={() => {
                if (onToggleSelection && !isDisabled) {
                    onToggleSelection(listing.id);
                }
            }}
            className={`rounded-xl shadow-sm border p-5 hover:shadow-md transition-all relative group cursor-pointer
                ${isNotAvailable ? 'border-t-4 border-red-600' : ''}
                ${isSelected
                    ? 'bg-green-50 border-primary ring-1 ring-primary' // Selected State
                    : isNotAvailable
                        ? 'bg-white border-gray-100 hover:border-red-300 hover:shadow-red-100'  // NOT AVAILABLE hover - red tint
                        : 'bg-white border-gray-100 hover:border-green-200'  // Normal State
                }
                ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {isNotAvailable && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-[50]">
                    <div className="bg-red-600 px-6 py-1.5 rounded-2xl shadow-md flex items-center justify-center min-w-[160px]">
                        <span className="text-[12px] font-black uppercase tracking-[0.25em] text-white">
                            {listing.statusAQ}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start mb-1">
                <div className="flex flex-col gap-1.5 flex-1 mr-4">

                    <div className="flex gap-1.5 flex-wrap">
                        {listing.saleType && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600">
                                {listing.saleType.toUpperCase()}
                            </span>
                        )}
                        {listing.isDirect && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800">
                                DIRECT
                            </span>
                        )}
                    </div>


                </div>
                <div className="flex items-center gap-2">
                    {listing.facebookLink && (
                        <a
                            href={listing.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white hover:bg-[#1877F2] transition-colors"
                            title="View on Facebook"
                        >
                            <Facebook size={18} fill="currentColor" strokeWidth={0} />
                        </a>
                    )}
                    <div className="flex flex-col items-end">
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMapClick) onMapClick(listing);
                            }}
                            className="text-2xl font-black text-black font-sans cursor-pointer hover:text-primary hover:underline transition-colors tracking-tighter"
                            title="View on Map"
                        >
                            {listing.id}
                        </span>
                    </div>
                </div>
            </div>

            {/* Removed combined BC/BD block from bottom - moved to specific locations */}

            <div className="mb-4 mt-0.5">
                <div className="w-full bg-gray-100 p-2 rounded-lg shadow-inner flex flex-col items-center justify-center gap-0.5 text-center">


                    {activeFilter === 'Lease' ? (
                        <>
                            {listing.leasePrice > 0 && (
                                <div className="flex items-baseline gap-1 text-primary justify-center">
                                    <span className="text-xl font-bold">{formatPrice(listing.leasePrice)}/month</span>
                                    {listing.leasePricePerSqm > 0 && (
                                        <span className="text-sm font-normal text-gray-500">
                                            ({formatPrice(listing.leasePricePerSqm)}/sqm)
                                        </span>
                                    )}
                                </div>
                            )}
                            {listing.price > 0 && (
                                <div className="flex items-baseline gap-2 justify-center">
                                    <span className="text-xl font-bold text-primary">{formatPrice(listing.price)}</span>
                                    {listing.pricePerSqm > 0 && (
                                        <span className="text-sm font-normal text-gray-500">
                                            ({formatPrice(listing.pricePerSqm)}/sqm)
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {listing.price > 0 && (
                                <div className="flex items-baseline gap-2 justify-center">
                                    <span className="text-xl font-bold text-primary">{formatPrice(listing.price)}</span>
                                    {listing.pricePerSqm > 0 && (
                                        <span className="text-sm font-normal text-gray-500">
                                            ({formatPrice(listing.pricePerSqm)}/sqm)
                                        </span>
                                    )}
                                </div>
                            )}
                            {listing.leasePrice > 0 && (
                                <div className="flex items-baseline gap-1 text-primary justify-center">
                                    <span className="text-xl font-bold">{formatPrice(listing.leasePrice)}/month</span>
                                    {listing.leasePricePerSqm > 0 && (
                                        <span className="text-sm font-normal text-gray-500">
                                            ({formatPrice(listing.leasePricePerSqm)}/sqm)
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{listing.city}, {listing.province}</span>
                </div>
                {(listing.building || listing.area || listing.barangay) && (
                    <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span className="truncate">{listing.building || listing.area || listing.barangay}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4" />
                    {listing.lotArea > 0 && listing.floorArea > 0 ? (
                        // Both lot and floor area present - use 2 lines
                        <div className="flex flex-col">
                            <span>{listing.lotArea.toLocaleString()} sqm Lot Area</span>
                            <span>{listing.floorArea.toLocaleString()} sqm Floor Area</span>
                        </div>
                    ) : (
                        // Only one area present - single line
                        <span>
                            {listing.lotArea > 0 && (
                                <>
                                    {listing.lotArea.toLocaleString()} sqm Lot Area
                                </>
                            )}
                            {listing.floorArea > 0 && (
                                <>
                                    {listing.floorArea.toLocaleString()} sqm Floor Area
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Removed combined BC/BD block from bottom - moved to specific locations */}

            {/* Sponsored badge at bottom */}
            {isSponsored && !isNotAvailable && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                    <div className="bg-[#3a9a6b] px-6 py-1.5 rounded-2xl shadow-md flex items-center justify-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                            SPONSORED
                        </span>
                    </div>
                </div>
            )}



        </div >
    );
});

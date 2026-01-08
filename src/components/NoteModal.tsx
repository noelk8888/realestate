import React, { useEffect } from 'react';
import { X, FileText } from 'lucide-react';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    title?: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
    isOpen,
    onClose,
    content,
    title = 'Listing Note'
}) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl scale-100 opacity-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-yellow-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-2 text-yellow-800">
                        <FileText size={20} />
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-500 hover:text-primary"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base font-medium">
                        {content}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

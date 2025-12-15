import React, { useState, useEffect, useRef } from 'react';

interface DualRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    formatMinValue?: (val: number) => string;
    formatMaxValue?: (val: number) => string;
}

interface EditableLabelProps {
    value: number;
    format?: (val: number) => string;
    onCommit: (val: number) => void;
}

const EditableLabel: React.FC<EditableLabelProps> = ({ value, format, onCommit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempVal, setTempVal] = useState(value.toString());

    useEffect(() => {
        setTempVal(value.toString());
    }, [value]);

    const handleCommit = () => {
        const newVal = parseFloat(tempVal);
        if (isNaN(newVal)) {
            setIsEditing(false);
            setTempVal(value.toString());
            return;
        }
        onCommit(newVal);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                type="number"
                value={tempVal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setTempVal(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommit();
                    if (e.key === 'Escape') {
                        setTempVal(value.toString());
                        setIsEditing(false);
                    }
                }}
                className="w-24 p-1 text-sm font-mono border-2 border-blue-500 rounded bg-white text-gray-900 shadow-lg outline-none text-center z-50"
            />
        );
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 px-2 py-0.5 rounded transition-all select-none border border-transparent hover:border-blue-200"
            title="Click to edit value"
        >
            {format ? format(value) : value}
        </span>
    );
};

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, step = 1, value, onChange, formatMinValue, formatMaxValue }) => {
    const [minVal, setMinVal] = useState(value[0]);
    const [maxVal, setMaxVal] = useState(value[1]);
    const minValRef = useRef(value[0]);
    const maxValRef = useRef(value[1]);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = (value: number) => Math.round(((value - min) / (max - min)) * 100);

    // Sync state with props
    useEffect(() => {
        setMinVal(value[0]);
        setMaxVal(value[1]);
        minValRef.current = value[0];
        maxValRef.current = value[1];
    }, [value, min, max]);

    // Update range track visual
    useEffect(() => {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxValRef.current);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, min, max]);

    useEffect(() => {
        const minPercent = getPercent(minValRef.current);
        const maxPercent = getPercent(maxVal);

        if (range.current) {
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [maxVal, min, max]);

    const updateMin = (newVal: number) => {
        let val = newVal;
        // Constraints
        val = Math.max(val, min); // limitMin (global min)
        val = Math.min(val, max); // limitMax (global max) - though logically for min handle, max is value[1]

        // Cross-check: min handle must be < max handle
        // We use maxValRef.current to be safe, but state maxVal is also fine
        val = Math.min(val, maxVal - (step || 1));

        setMinVal(val);
        minValRef.current = val;
        onChange([val, maxVal]);
    };

    const updateMax = (newVal: number) => {
        let val = newVal;
        // Constraints
        val = Math.max(val, min);
        val = Math.min(val, max);

        // Cross-check: max handle must be > min handle
        val = Math.max(val, minVal + (step || 1));

        setMaxVal(val);
        maxValRef.current = val;
        onChange([minVal, val]);
    };

    return (
        <div className="flex flex-col w-full gap-2">
            <div className="flex justify-between items-center px-1">
                <EditableLabel
                    value={minVal}
                    format={formatMinValue}
                    onCommit={updateMin}
                />
                <EditableLabel
                    value={maxVal}
                    format={formatMaxValue}
                    onCommit={updateMax}
                />
            </div>

            <div className="relative w-full h-6 flex items-center select-none pt-2">
                {/* Track Background */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minVal}
                    onChange={(event) => {
                        const value = Math.max(Number(event.target.value), min);
                        // Prevent crossing
                        const newVal = Math.min(value, maxVal - 1);
                        setMinVal(newVal);
                        minValRef.current = newVal;
                        onChange([newVal, maxVal]);
                    }}
                    className="thumb thumb--left w-full absolute z-30 h-0 outline-none pointer-events-none appearance-none"
                    style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxVal}
                    onChange={(event) => {
                        const value = Math.min(Number(event.target.value), max);
                        // Prevent crossing
                        const newVal = Math.max(value, minVal + 1);
                        setMaxVal(newVal);
                        maxValRef.current = newVal;
                        onChange([minVal, newVal]);
                    }}
                    className="thumb thumb--right w-full absolute z-40 h-0 outline-none pointer-events-none appearance-none"
                />

                <div className="relative w-full h-1">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-300 rounded-full"></div>
                    <div ref={range} className="absolute top-0 h-1 bg-blue-600 rounded-full"></div>
                </div>
            </div>

            <style>{`
                .thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: transparent;
                    pointer-events: all;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background-color: #2563eb;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                    position: relative;
                }
                /* Firefox */
                .thumb::-moz-range-thumb {
                    pointer-events: all;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background-color: #2563eb;
                    cursor: pointer;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                }
            `}</style>
        </div>
    );
};



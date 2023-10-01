import React, { useState } from 'react';

type IncludePositionButtonProps = {
    onClick: () => void;
    onUndo: () => void;
};

export const IncludePositionButton: React.FC<IncludePositionButtonProps> = ({ onClick, onUndo }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block text-left">
            <div className="flex">
                <button
                    onClick={onClick}
                    className="inline-flex justify-between items-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-l">
                    Include Position
                </button>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded-r">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 12l-6-6h12l-6 6z" />
                    </svg>
                </button>
            </div>
            {isOpen && (
                <div className="absolute right-0 mt-2 py-1 w-48 bg-white rounded-lg shadow-xl">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onUndo();
                        }}
                        className="flex justify-between w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-green-500 hover:text-white">
                        Undo Last
                    </button>
                </div>
            )}
        </div>
    );
};

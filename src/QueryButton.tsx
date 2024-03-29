import React, { useState } from 'react';


type QueryButtonProps = {
    onClick: (option: 'white' | 'black' | 'default') => void;
    onOptionChange: (option: 'white' | 'black' | 'default') => void;
};

export const QueryButton: React.FC<QueryButtonProps> = ({ onClick, onOptionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<'white' | 'black' | 'default'>('default');

    const CheckmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
        <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24">
            <path d="M6 12l4 4 8-8-1.5-1.5L10 14l-2.5-2.5L6 12z" fill="currentColor" />
        </svg>
    );

    const handleButtonClick = () => {
        onClick(selectedOption);
    };

    const handleOptionChange = (option: 'white' | 'black' | 'default') => {
        setSelectedOption(option);
        setIsOpen(false);
        onOptionChange(option);
    };

    return (
        <div className="relative inline-block text-left">
            <div className="flex">
                <button
                    onClick={handleButtonClick}
                    className="inline-flex justify-between items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-l">
                    Query Tree
                </button>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-r">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 12l-6-6h12l-6 6z" />
                    </svg>
                </button>
            </div>
            {isOpen && (
                <div className="absolute right-0 mt-2 py-1 w-48 bg-white rounded-lg shadow-xl">
                    <button onClick={() => handleOptionChange('default')} className="flex justify-between w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-blue-500 hover:text-white">
                        Next to move
                        {selectedOption === 'default' && <CheckmarkIcon className="text-gray-700" />}
                    </button>
                    <button onClick={() => handleOptionChange('white')} className="flex justify-between w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-blue-500 hover:text-white">
                        For White
                        {selectedOption === 'white' && <CheckmarkIcon className="text-gray-700" />}
                    </button>
                    <button onClick={() => handleOptionChange('black')} className="flex justify-between w-full text-left px-4 py-2 text-sm capitalize text-gray-700 hover:bg-blue-500 hover:text-white">
                        For Black
                        {selectedOption === 'black' && <CheckmarkIcon className="text-gray-700" />}
                    </button>
                </div>
            )}
        </div>
    );
};

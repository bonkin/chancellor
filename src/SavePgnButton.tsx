import React from 'react';
import useSavePgn from "./hooks/useSafePgn";


interface SavePgnButtonProps {
    variants: any[]; // Replace any[] with the proper type
    openingName: string;
}

const SavePgnButton: React.FC<SavePgnButtonProps> = ({ variants, openingName }) => {
    const { isSaving, savePgn } = useSavePgn(variants, openingName);

    return (
        <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={isSaving}
            onClick={savePgn}
        >
            {isSaving ? 'Saving...' : 'Save PGN'}
        </button>
    );
}

export default SavePgnButton;

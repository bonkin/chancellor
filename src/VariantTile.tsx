import React from 'react';
import {MoveData} from "./logic/Lichess";

interface VariantTileProps {
    variant: { moves: MoveData[] };
    index: number;
    totalVariants: number;
    onMoveClick: (pv: MoveData[]) => void;
}

const VariantTile: React.FC<VariantTileProps> = ({ variant, index, totalVariants, onMoveClick }) => {
    return (
        <div
            className="p-3 m-2 rounded-sm bg-blue-50 hover:shadow-lg"
            style={{position: 'relative'}}
        >
            <sup style={{position: 'absolute', top: '5px', left: '5px', fontSize: '0.6em', color: 'navy'}}>
                {index + 1}/{totalVariants}
            </sup>

            <div className="flex flex-wrap cursor-pointer hover:text-blue-500">
                {variant.moves.map((moveData: MoveData, moveIndex: number) => {
                    const moveNum = Math.floor(moveIndex / 2) + 1;
                    const isWhiteMove = moveIndex % 2 === 0;
                    return (
                        <div key={moveIndex} className="flex items-center">
                            {isWhiteMove && <span className="mr-2">{moveNum}.</span>}
                            <span
                                className="mr-2 cursor-pointer hover:underline"
                                onClick={() => {
                                    const sliceEnd = moveIndex + 1;
                                    const pv: MoveData[] = variant.moves.slice(0, sliceEnd);
                                    onMoveClick(pv);
                                }}
                            >
                                {moveData.san}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default VariantTile;

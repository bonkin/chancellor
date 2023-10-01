import React from 'react';
import {MoveData, Variant} from "./logic/Lichess";
import ChessUtils from "./utils/ChessUtils";

interface VariantTileProps {
    variant: Variant;
    index: number;
    totalVariants: number;
    isIncludedPosition: boolean;
    onMoveClick: (pv: MoveData[]) => void;
}

const VariantTile: React.FC<VariantTileProps> = ({variant, index, totalVariants, isIncludedPosition, onMoveClick}) => {
    return (
        <div
            className={`p-3 m-2 rounded-sm hover:shadow-lg ${isIncludedPosition ? 'bg-green-50' : 'bg-blue-50'}`}
            style={{position: 'relative'}}
        >
            <sup style={{position: 'absolute', top: '5px', left: '5px', fontSize: '0.6em', color: 'navy'}}>
                {index + 1}/{totalVariants}
            </sup>

            <div className="flex flex-wrap cursor-pointer hover:text-blue-500">
                {variant.moves.map((move: MoveData, moveIndex: number) => {
                    const san = `${move.san}${move.annotation || ''}`;
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
                                {san}
                            </span>
                        </div>
                    );
                })}
                <span className="text-black"> {ChessUtils.getGameResult(variant.wcp)} </span>
            </div>
        </div>
    );
}

export default VariantTile;

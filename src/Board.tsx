import React, {useEffect, useRef, useState} from 'react';
import {Chessground as ChessgroundApi} from 'chessground';
import {Api} from 'chessground/api';
import {Config} from 'chessground/config';
import {MoveData} from "./logic/Lichess";
import {Chess} from "chess.js";
import {Key} from "chessground/types";

interface Props {
    width?: number
    height?: number
    contained?: boolean;
    config?: Config,
    onMovesUpdate: (moves: MoveData[]) => void,
    externalMoves: MoveData[],
}

function Board({
                   config = {},
                   onMovesUpdate,
                   externalMoves,
               }: Props) {
    const [api, setApi] = useState<Api | undefined>(undefined);
    const [currentMoves, setCurrentMoves] = useState<MoveData[]>([]);
    const [chess] = useState(() => new Chess());

    const legalMovesToDests: () => Map<Key, Key[]> = () => {
        const legalMoves = chess.moves({verbose: true});
        const dests = new Map<Key, Key[]>();
        for (let move of legalMoves) {
            if (!dests.has(move.from)) {
                dests.set(move.from, []);
            }
            dests.set(move.from, [...dests.get(move.from)!, move.to]);
        }
        return dests;
    }

    const isValidMove: (orig: Key, dest: Key) => any = (orig: Key, dest: Key) => {
        const dests = legalMovesToDests();
        const validDests = dests.get(orig);
        return validDests?.includes(dest);
    }

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && !api) {
            const chessgroundApi = ChessgroundApi(ref.current, {
                movable: {
                    free: false,
                    dests: legalMovesToDests(),
                    events: {
                        after: (orig: Key, dest: Key, metadata) => {
                            // check if the move is valid before making it
                            if (isValidMove(orig, dest)) {
                                // make the move in the chess instance
                                const moveObj = chess.move({from: orig, to: dest, promotion: 'q'});
                                if (moveObj) {
                                    const moveData: MoveData = {
                                        uci: `${orig}${dest}`,
                                        san: moveObj.san,
                                        averageRating: 0,
                                        white: 0,
                                        draws: 0,
                                        black: 0,
                                    };
                                    setCurrentMoves(prevMoves => {
                                        const newMoves = [...prevMoves, moveData];
                                        setTimeout(() => onMovesUpdate(newMoves), 0);
                                        return newMoves;
                                    });
                                    // update the dests in the chessground instance
                                    chessgroundApi.set({movable: {dests: legalMovesToDests()}});
                                }
                            }
                        },
                    },
                },
            });
            setApi(chessgroundApi);
        }
    }, [ref.current]);


    useEffect(() => {
        if (currentMoves.length > 0) {
            console.log(currentMoves.map(move => move.san).join(' '));
        }
    }, [currentMoves]);

    useEffect(() => {
        api?.set(config);
    }, [api, config]);

    useEffect(() => {
        setCurrentMoves(externalMoves);
        chess.reset();
        for (const moveData of externalMoves) {
            chess.move(moveData.san);
        }
        api?.set({
            fen: chess.fen(),
            movable: {dests: legalMovesToDests()}
        });
    }, [externalMoves]);

    useEffect(() => {
        const handleResize = () => {
            api?.redrawAll();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [api]);

    return (
        <div style={{width: '100%', margin: 'auto'}}>
            <div style={{paddingTop: '100%', position: 'relative'}}>
                <div ref={ref} style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0}}/>
            </div>
        </div>
    );

}

export default Board;

import ChessUtils from "./ChessUtils";
import {MoveData} from "../logic/Lichess";

class Moves {
    static sortByWinRate(sideToMove: any, moves: MoveData[]): MoveData[] {
        moves.sort((a: MoveData, b: MoveData) => {
            const winRateA = ChessUtils.winRate(a, sideToMove);
            const winRateB = ChessUtils.winRate(b, sideToMove);
            return winRateB - winRateA;
        });
        return moves;
    }

    static sortByPopularity(moves: MoveData[]): MoveData[] {
        return moves.sort((a: MoveData, b: MoveData) => b.white + b.black + b.draws - a.white - a.black - a.draws);
    }

    static totalOccurrences(moves: MoveData[]): number {
        return moves.reduce((a: number, b: MoveData) => a + Moves.moveOccurrences(b), 0);
    }

    static moveOccurrences(move: MoveData): number {
        return move.white + move.black + move.draws;
    }
}

export default Moves;
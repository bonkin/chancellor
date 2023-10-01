import ChessUtils from "./ChessUtils";
import {MoveData, Variant} from "../logic/Lichess";

class Moves {

    static wilsonScore(move: MoveData, sideToMove: 'white' | 'black'): number {
        const n = Moves.moveOccurrences(move);
        if (n === 0) return 0;

        // The value z=1.96 corresponds to the 95% confidence level in the Z-distribution.
        // For more details, see: https://en.wikipedia.org/wiki/Normal_distribution#Standard_normal_distribution
        const z = 1.96;
        const phat = ChessUtils.winRate(move, sideToMove);
        const denominator = 1 + (z * z) / n;

        const term1 = phat + (z * z) / (2 * n);
        const term2 = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);
        return (term1 - term2) / denominator;
    }

    static sortByWinRate(sideToMove: "white" | "black", moves: MoveData[]): MoveData[] {
        moves.sort((a: MoveData, b: MoveData) => {
            const scoreA = Moves.wilsonScore(a, sideToMove);
            const scoreB = Moves.wilsonScore(b, sideToMove);
            return scoreB - scoreA;
        });
        return moves;
    }

    static sortByIncludedMovesAndWinRate(candidateMoves: MoveData[], sideToMove: "white" | "black", play: MoveData[], included: Variant[]): MoveData[] {
        const includedMoves: MoveData[][] = included
            .map(variant => variant.moves.slice(0, play.length + 1))
            .filter(moves => moves.length > play.length);

        const includedMovesCanTranspose: MoveData[][] = included
            .map(variant => variant.moves.slice(0, play.length + 3))
            .filter(moves => moves.length > play.length + 2)
            .map(moves => [...moves.slice(0, play.length), moves[play.length + 2]])
            .filter(moves => ChessUtils.isLegal(moves));

        const isIncludedCache: Map<MoveData, boolean> = new Map();
        const canBeNextMoveAndIncludedCache: Map<MoveData, boolean> = new Map();

        candidateMoves.forEach(move => {
            isIncludedCache.set(move, includedMoves.some(variant => ChessUtils.isTransposition(variant, [...play, move])));
            canBeNextMoveAndIncludedCache.set(move, includedMovesCanTranspose.some(variant => ChessUtils.isTransposition(variant, [...play, move])));
        });

        return [...candidateMoves].sort((a, b) => {
            const aIsIncluded = isIncludedCache.get(a) || false;
            const bIsIncluded = isIncludedCache.get(b) || false;
            const aCanBeNextMoveAndIncluded = canBeNextMoveAndIncludedCache.get(a) || false;
            const bCanBeNextMoveAndIncluded = canBeNextMoveAndIncludedCache.get(b) || false;

            if (aIsIncluded !== bIsIncluded) {
                return aIsIncluded ? -1 : 1;
            } else if (aCanBeNextMoveAndIncluded !== bCanBeNextMoveAndIncluded) {
                return aCanBeNextMoveAndIncluded ? -1 : 1;
            } else {
                return Moves.wilsonScore(b, sideToMove) - Moves.wilsonScore(a, sideToMove);
            }
        });
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
import {MoveData, Variant} from "../logic/Lichess";
import Moves from "./Moves";


describe('Moves', () => {
    describe('sortByWinRate', () => {
        it('should sort moves based on their win rate using Wilson Score', () => {
            const mockMoves: MoveData[] = [
                { uci: 'e2e4', san: 'e4', averageRating: 1500, white: 40, draws: 20, black: 40 },
                { uci: 'd2d4', san: 'd4', averageRating: 1500, white: 100, draws: 50, black: 50 },
                { uci: 'c2c4', san: 'c4', averageRating: 1500, white: 30, draws: 10, black: 60 }
            ];

            const sortedMoves = Moves.sortByWinRate('white', mockMoves);

            // Expecting the move with UCI 'd2d4' to be the first since it has the highest win rate with a good sample size
            expect(sortedMoves[0].uci).toBe('d2d4');
            expect(sortedMoves[1].uci).toBe('e2e4');
            expect(sortedMoves[2].uci).toBe('c2c4');
        });
    });

    describe('sortByIncludedMovesAndWinRate', () => {
        const includedVariant: Variant = {
            moves: [
                {uci: 'e2e4', san: 'e4', averageRating: 1500, white: 400, draws: 200, black: 400},
                {uci: 'e7e5', san: 'e5', averageRating: 1500, white: 300, draws: 200, black: 500},
                {uci: 'f1c4', san: 'Bc4', averageRating: 1500, white: 450, draws: 100, black: 450},
                {uci: 'g8f6', san: 'Nf6', averageRating: 1500, white: 350, draws: 150, black: 500},
                {uci: 'd2d4', san: 'd4', averageRating: 1500, white: 500, draws: 250, black: 250},
                {uci: 'e5d4', san: 'exd4', averageRating: 1500, white: 300, draws: 200, black: 500},
                {uci: 'g1f3', san: 'Nf3', averageRating: 1500, white: 400, draws: 200, black: 400},
                {uci: 'b8c6', san: 'Nc6', averageRating: 1500, white: 350, draws: 250, black: 400},
                {uci: 'e1g1', san: 'O-O', averageRating: 1500, white: 450, draws: 150, black: 400},
                {uci: 'f6e4', san: 'Nxe4', averageRating: 1500, white: 300, draws: 250, black: 450}
            ],
            wwr: 0,
            wcp: 0,
        };
        it('should prioritize moves included by the user', () => {
            // Other mock moves which are not included in the variant
            const candidateMoves: MoveData[] = [
                {uci: 'f1c4', san: 'Bc4', averageRating: 1500, white: 450, draws: 100, black: 450},
                {uci: 'g1f3', san: 'Nf3', averageRating: 1500, white: 450, draws: 200, black: 350},
                {uci: 'd2d4', san: 'd4', averageRating: 1500, white: 500, draws: 250, black: 250},
                {uci: 'd2d3', san: 'd3', averageRating: 1500, white: 300, draws: 200, black: 500},
                {uci: 'f2f4', san: 'f4', averageRating: 1500, white: 400, draws: 200, black: 400},
            ];

            // Sorting the moves considering the included variant
            const sortedMoves = Moves.sortByIncludedMovesAndWinRate(candidateMoves, 'white', includedVariant.moves.slice(0, 2), [includedVariant]);

            // Expecting the move 'f1c4' to be the first since it is part of the included variant
            expect(sortedMoves[0].uci).toBe('f1c4');
            expect(sortedMoves[1].uci).toBe('d2d4');
            expect(sortedMoves[2].uci).toBe('g1f3');
            expect(sortedMoves[3].uci).toBe('f2f4');
            expect(sortedMoves[4].uci).toBe('d2d3');
        });
    });
});

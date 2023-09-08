import {MoveData} from "../logic/Lichess";
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
});

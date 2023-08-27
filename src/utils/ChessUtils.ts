import * as cg from "chessground/types";
import * as Chess from "chess.js";
import {MoveData, SAN} from "../logic/Lichess";


const INF_CP = 4000;
const DRAW_WIN_RATE = 500;
const UNDEFINED_WIN_RATE = 500;
const WHITE_WIN_RATE = 1000;
const BLACK_WIN_RATE = 0;

class ChessUtils {

    static playToFEN(play: MoveData[]): string {
        const chess = new Chess.Chess();

        for (const move of play) {
            // chess.js requires moves to be in standard algebraic notation (SAN), not UCI
            // If the moves are in UCI format, you'll need to convert them to SAN first
            if (!chess.move(move.san)) {
                throw new Error(`Invalid move: ${move}`);
            }
        }
        return chess.fen();
    }

    static playToMoves(play: MoveData[]): Array<{ move: MoveData, piece: { role: cg.Role, color: cg.Color } }> {
        const chess = new Chess.Chess();
        const movesWithPieces: Array<{ move: MoveData, piece: { role: cg.Role, color: cg.Color } }> = [];

        for (const moveData of play) {
            const move = chess.move(moveData.san);

            if (!move) {
                throw new Error(`Invalid move: ${moveData.san}`);
            }

            const piece: { role: cg.Role, color: cg.Color } = {
                role: move.piece as cg.Role, // You might need to map 'b' to 'bishop', 'k' to 'king', etc.
                color: move.color === 'w' ? 'white' : 'black',
            };

            movesWithPieces.push({
                move: moveData,
                piece,
            });
        }

        return movesWithPieces;
    }


    /**
     * Helper function to convert UCI move to SAN.
     *
     * @param chess Chess.js instance
     * @param uciMove UCI move to convert
     * @returns SAN move
     */
    static uciToSan(chess: Chess.Chess, uciMove: string): SAN {
        const from = uciMove.slice(0, 2);
        let to = uciMove.slice(2, 4);
        const promotion = uciMove.length === 5 ? uciMove[4] : undefined;

        if (process.env.REACT_APP_DATABASE_EXPLORER === 'https://explorer.lichess.ovh/lichess') {
            // Translate Lichess-specific UCI notation to standard UCI notation for castling
            if (uciMove === "e1h1") {
                to = "g1";
            } else if (uciMove === "e1a1") {
                to = "c1";
            } else if (uciMove === "e8h8") {
                to = "g8";
            } else if (uciMove === "e8a8") {
                to = "c8";
            }
        }

        const sanMove = chess.move({from, to, promotion});

        if (!sanMove) {
            throw new Error(`Invalid UCI move: ${uciMove}`);
        }

        return sanMove.san;
    }

    static winRate(move: MoveData, sideToMove: 'white' | 'black'): number {
        const totalGames = move.white + move.draws + move.black;
        const winRate = sideToMove === 'white' ? move.white / totalGames : move.black / totalGames;
        const drawRate = move.draws / totalGames;
        return winRate + drawRate / 2;
    }

    // Function win_rate_model from Stockfish
    static expectedWinsPer1000(v: number, ply: number): number {
        // The model only captures up to 240 plies, so limit the input and then rescale
        const m = Math.min(240, ply) / 64.0;
        // The coefficients of a third-order polynomial fit is based on the fishtest data
        // for two parameters that need to transform eval to the argument of a logistic
        // function.
        const as = [0.38036525, -2.82015070, 23.17882135, 307.36768407];
        const bs = [-2.29434733, 13.27689788, -14.26828904, 63.45318330];

        const a = (((as[0] * m + as[1]) * m + as[2]) * m) + as[3];
        const b = (((bs[0] * m + bs[1]) * m + bs[2]) * m) + bs[3];
        // Transform the eval to centipawns with limited range
        const x = Math.max(Math.min(v, INF_CP), -INF_CP);
        // Return the win rate in per mille units rounded to the nearest value
        return Math.round(1000 / (1 + Math.exp((a - x) / b)));
    }

    static expectedPointsPer1000(v: number, ply: number): number {
        const ourWinRate = ChessUtils.expectedWinsPer1000(v, ply);
        const oppWinRate = ChessUtils.expectedWinsPer1000(-v, ply);
        const drawRate = 1000 - ourWinRate - oppWinRate;
        return ourWinRate + drawRate / 2;
    }
}

export default ChessUtils;
export {BLACK_WIN_RATE, DRAW_WIN_RATE, UNDEFINED_WIN_RATE, INF_CP, WHITE_WIN_RATE};
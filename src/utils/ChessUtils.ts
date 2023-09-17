import * as cg from "chessground/types";
import * as Chess from "chess.js";
import {MoveData, SAN} from "../logic/Lichess";
import {Square, SQUARES} from "chess.js";


const INF_CP = 4000;
const DRAW_WIN_RATE = 500;
const UNDEFINED_WIN_RATE = 500;
const WHITE_WIN_RATE = 1000;
const BLACK_WIN_RATE = 0;

type ChessPiece = 'p' | 'P' | 'n' | 'N' | 'b' | 'B' | 'r' | 'R' | 'q' | 'Q' | 'k' | 'K';

class ChessUtils {

    static playToChessInstance(play: MoveData[]): Chess.Chess {
        const chess = new Chess.Chess();
        for (const move of play) {
            if (!chess.move(move.san)) {
                throw new Error(`Invalid move: ${move.san}`);
            }
        }
        return chess;
    }

    static playToFEN(play: MoveData[]): string {
        const chess = ChessUtils.playToChessInstance(play);
        return chess.fen();
    }

    static getCapturedPieceType(play: MoveData[], move: MoveData): Chess.PieceSymbol | null {
        if (ChessUtils.isCaptureMove(move)) {
            const captureSquare = move.uci.slice(2, 4);
            const chess = ChessUtils.playToChessInstance(play);
            const piece = chess.get(captureSquare as Chess.Square);
            if (piece) {
                return piece.type;
            }
        }
        return null;
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

    static getGameResult(wcp: number): '∓' | '⩱' | '±' | '=' | '⩲' | '+-' | '-+' {
        if (wcp > 300) {
            return '+-'; // White has a decisive advantage
        } else if (wcp > 150) {
            return '±'; // White has a significant advantage
        } else if (wcp > 50) {
            return '⩲'; // White has a moderate advantage
        } else if (wcp >= -50) {
            return '='; // Even position
        } else if (wcp >= -150) {
            return '⩱'; // White has a moderate advantage
        } else if (wcp >= -300) {
            return '∓'; // Black has a significant advantage
        } else {
            return '-+'; // Black has a decisive advantage
        }
    };

    static isCheckmateMove(move: MoveData): boolean {
        return move.san.endsWith('#');
    }

    static isCaptureMove(move: MoveData): boolean {
        return move.san.includes('x');
    }

    private static isChessPiece(piece: string): piece is ChessPiece {
        return ['p', 'P', 'n', 'N', 'b', 'B', 'r', 'R', 'q', 'Q', 'k', 'K'].includes(piece);
    }

    static getMaterialValueCP(chess: Chess.Chess): number {
        const pieces = chess.fen().split(" ")[0];
        const materialValues: Record<ChessPiece, number> = {
            'p': -100, 'P': +100,
            'n': -300, 'N': +300,
            'b': -300, 'B': +300,
            'r': -500, 'R': +500,
            'q': -900, 'Q': +900,
            'k': 0, 'K': 0,
        };

        return [...pieces]
            .filter(ChessUtils.isChessPiece)
            .reduce((acc: number, piece: ChessPiece) => acc + materialValues[piece], 0);
    };

    static pawnsThreatenOpponentPiece(chess: Chess.Chess, ourColor: 'w' | 'b'): boolean {
        const opponentColor = ourColor === 'w' ? 'b' : 'w';

        // Get squares of our pawns
        const ourPawns = SQUARES.filter(square => {
            const piece = chess.get(square);
            return piece && piece.color === ourColor && piece.type === 'p';
        });

        // Get squares of opponent's pieces (excluding pawns)
        const opponentPieces = SQUARES.filter(square => {
            const piece = chess.get(square);
            return piece && piece.color === opponentColor && piece.type !== 'p';
        });

        // Check if any of our pawns threaten any opponent piece
        for (const pawnSquare of ourPawns) {
            const attackedSquares = this.getPawnAttackedSquares(pawnSquare, ourColor, chess);
            for (const attackedSquare of attackedSquares) {
                if (opponentPieces.includes(attackedSquare)) {
                    return true;
                }
            }
        }

        return false;
    }

    static getPawnAttackedSquares(pawnSquare: Chess.Square, ourColor: 'w' | 'b', chess: Chess.Chess): Chess.Square[] {
        const file = pawnSquare.charCodeAt(0);
        const rank = parseInt(pawnSquare[1], 10);

        let attackedSquares: Chess.Square[] = [];

        const a = 97; // 'a' in char code
        const h = 104; // 'h' in char code
        if (ourColor === 'w') {
            if (file > a) { // 'a' in char code
                attackedSquares.push((String.fromCharCode(file - 1) + (rank + 1)) as Chess.Square);
            }
            if (file < h) {
                attackedSquares.push((String.fromCharCode(file + 1) + (rank + 1)) as Chess.Square);
            }
        } else {
            if (file > a) {
                attackedSquares.push((String.fromCharCode(file - 1) + (rank - 1)) as Chess.Square);
            }
            if (file < h) {
                attackedSquares.push((String.fromCharCode(file + 1) + (rank - 1)) as Chess.Square);
            }
        }

        attackedSquares = attackedSquares.filter(square => {
            const rank = parseInt(square[1], 10);
            return rank >= 1 && rank <= 8;
        });

        return attackedSquares.filter(square => chess.get(square));
    }

}

export default ChessUtils;
export {BLACK_WIN_RATE, DRAW_WIN_RATE, UNDEFINED_WIN_RATE, INF_CP, WHITE_WIN_RATE};
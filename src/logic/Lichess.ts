import * as Chess from 'chess.js';
import {DrawShape} from "chessground/draw";
import NetworkRequestUtils from "../utils/NetworkRequestUtils";
import CacheManager from "../utils/CacheManager";
import MoveFetcher from "../utils/MoveFetcher";
import ChessUtils, {
    BLACK_WIN_RATE,
    DRAW_WIN_RATE,
    UNDEFINED_WIN_RATE,
    INF_CP,
    WHITE_WIN_RATE
} from "../utils/ChessUtils";
import Shapes from "../utils/Shapes";
import Moves from "../utils/Moves";
import {Rating} from "../RatingSelect";
import {ExplorerSpeed} from "../SpeedSelect";


interface MoveData {
    uci: string;
    san: string;
    averageRating: number;
    white: number;
    draws: number;
    black: number;
    annotation?: Annotation;
    popularBlunderSequences?: Variant[];
}

interface Evaluation {
    wcp: number;
    wwr: number;
    bestMove: MoveData;
    bestSequence: MoveData[];
    probability: number;
}

interface Variant {
    moves: MoveData[];
    wwr: number;
    wcp: number;
}

interface SearchResults {
    wcp: {
        engine?: number;
        statistics: number;
    }
    wwr: number;
    variants: Variant[];
}

interface Score {
    wcp: number;
    wwr: number;
}

export type SAN = string;
export type FENKey = string;
export type Annotation = '!' | '?' | '!!' | '??' | '!?' | '?!';

const CLOUD_EVAL = process.env.REACT_APP_CLOUD_EVAL || 'http://127.0.0.1:9003/api/cloud-eval';
const STOP_AT_ACCUMULATED_PROB = Number(process.env.REACT_APP_STOP_AT_ACCUMULATED_PROB) || 0.10;
const MOVES_TO_CONSIDER = Number(process.env.REACT_APP_MOVES_TO_CONSIDER) || 2;
const ADDITIONAL_MOVES_AT_ROOT = Number(process.env.REACT_APP_ADDITIONAL_MOVES_AT_ROOT) || 0;
const SKIP_OPP_MOVES_WITH_PROB: number = Number(process.env.REACT_APP_SKIP_OPP_MOVES_WITH_PROB) || 0.010;
const CONSIDER_SOLID_MOVE_PROB: number = Number(process.env.REACT_APP_CONSIDER_SOLID_MOVE_PROB) || 0.100;
const CLEAR_BEST_MOVE_PROB: number = Number(process.env.REACT_APP_CLEAR_BEST_MOVE_PROB) || 0.70;
const MIN_EVAL_DIFF_TO_CONSIDER: number = Number(process.env.REACT_APP_MIN_EVAL_DIFF_TO_CONSIDER) || -150;
const MIN_FREQUENCY_TO_CONSIDER: number = Number(process.env.REACT_APP_MIN_FREQUENCY_TO_CONSIDER) || 0.02;
const DUBIOUS_MOVE_DIFF: number = Number(process.env.REACT_APP_DUBIOUS_MOVE_DIFF) || -50;
const MISTAKE_MOVE_DIFF: number = Number(process.env.REACT_APP_MISTAKE_MOVE_DIFF) || -100;
const BLUNDER_MOVE_DIFF: number = Number(process.env.REACT_APP_BLUNDER_MOVE_DIFF) || -200;
const INTERESTING_MOVE_DIFF: number = Number(process.env.REACT_APP_INTERESTING_MOVE_DIFF) || 50;
const GOOD_MOVE_DIFF: number = Number(process.env.REACT_APP_GOOD_MOVE_DIFF) || 100;
const BRILLIANT_MOVE_DIFF: number = Number(process.env.REACT_APP_BRILLIANT_MOVE_DIFF) || 200;
const INTERESTING_MOVE_THRESHOLD: number = Number(process.env.REACT_APP_INTERESTING_MOVE_THRESHOLD) || 0.40;
const GOOD_MOVE_THRESHOLD: number = Number(process.env.REACT_APP_GOOD_MOVE_THRESHOLD) || 0.25;
const BRILLIANT_MOVE_THRESHOLD: number = Number(process.env.REACT_APP_BRILLIANT_MOVE_THRESHOLD) || 0.15;
const SIGNIFICANT_ADVANTAGE_DIFF: number = Number(process.env.REACT_APP_SIGNIFICANT_ADVANTAGE_DIFF) || 500;
const BEFORE_OUR_MOVE_EVALUATION_MULTIPV: number = Number(process.env.REACT_APP_BEFORE_OUR_MOVE_EVALUATION_MULTIPV) || 2;
const BEFORE_OPP_MOVE_EVALUATION_MULTIPV: number = Number(process.env.REACT_APP_BEFORE_OPP_MOVE_EVALUATION_MULTIPV) || 2;
const END_NODE_EVALUATION_MULTIPV: number = Number(process.env.REACT_APP_END_NODE_EVALUATION_MULTIPV) || 1;

class Lichess {

    lichessAccessToken: string;
    chessDataUtils: MoveFetcher;
    cacheManager: CacheManager;

    constructor(lichessAccessToken: string) {
        this.lichessAccessToken = lichessAccessToken;
        this.chessDataUtils = new MoveFetcher(lichessAccessToken);
        this.cacheManager = new CacheManager();
    }

    async search(
        probability: number,
        ply: number,
        play: MoveData[],
        positions: FENKey[],
        startMoves: number,
        fen: string,
        setShapes: (shapes: DrawShape[]) => void,
        incrementProgress: () => void,
        ratings: Rating[],
        speeds: ExplorerSpeed[],
    ): Promise<SearchResults> {

        incrementProgress();
        const fenKey: FENKey = fen.split(' ').slice(0, 4).join(' '); // key components of FEN
        const cached = this.cacheManager.getTransposition(fenKey);
        if (cached) {
            return cached;
        }

        // Exit condition: repetition
        if (positions.indexOf(fenKey) !== -1) {
            console.log(`Repetition detected for ${fenKey} moves ${play.map(move => move.san).join(' ')}`);
            return {
                wcp: {
                    engine: 0,
                    statistics: 0,
                },
                wwr: DRAW_WIN_RATE,
                variants: []
            }
        }

        const sign = ply % 2 === 0 ? 1 : -1;
        const sideToMove = ply % 2 === 0 ? 'white' : 'black';

        // Exit condition: probability too low
        if (probability < STOP_AT_ACCUMULATED_PROB) {
            const positionEvaluation = (await this.evaluate(probability, play, END_NODE_EVALUATION_MULTIPV, fen))?.[0];
            if (positionEvaluation === undefined) {
                return {
                    wcp: {
                        engine: 0,
                        statistics: 0,
                    },
                    wwr: UNDEFINED_WIN_RATE,
                    variants: []
                }
            }

            setShapes(Shapes.createShapes(play, positionEvaluation, startMoves, sign));

            const nextPv = await this.chessDataUtils.fetchSingleResponseMovesPv(positionEvaluation, CLEAR_BEST_MOVE_PROB, play, ratings, speeds);

            return {
                wcp: {
                    engine: positionEvaluation.wcp,
                    statistics: positionEvaluation.wcp,
                },
                wwr: positionEvaluation.wwr,
                variants: [{
                    moves: nextPv,
                    wwr: positionEvaluation.wwr,
                    wcp: positionEvaluation.wcp,
                }],
            }
        }

        const positionEvaluations = await this.evaluate(probability, play, BEFORE_OUR_MOVE_EVALUATION_MULTIPV, fen);
        const positionEvaluation: Evaluation | undefined = positionEvaluations?.[0];

        // Exit condition: mate
        if (positionEvaluation?.wcp === INF_CP || positionEvaluation?.wcp === -INF_CP) {
            return {
                wcp: {
                    engine: positionEvaluation.wcp,
                    statistics: positionEvaluation.wcp,
                },
                wwr: positionEvaluation.wwr,
                variants: [{
                    moves: positionEvaluation.bestSequence,
                    wwr: positionEvaluation.wwr,
                    wcp: positionEvaluation.wcp,
                }],
            }
        }

        // Exit condition: significant advantage after capturing a piece
        const hasSignificantAdvantage = positionEvaluation && (sign * positionEvaluation.wcp) > SIGNIFICANT_ADVANTAGE_DIFF;
        if (hasSignificantAdvantage) {
            const isValuableCapture = ['n', 'b', 'r', 'q'].includes(ChessUtils.getCapturedPieceType(play, positionEvaluation.bestMove) || '');
            if (isValuableCapture) {
                console.log(`Significant advantage (${positionEvaluation.wcp} cp) after ${[...play, positionEvaluation.bestMove].map(move => move.san).join(' ')}`);

                const nextPv = await this.chessDataUtils.fetchSingleResponseMovesPv(positionEvaluation, CLEAR_BEST_MOVE_PROB, play, ratings, speeds);
                return {
                    wcp: {
                        engine: positionEvaluation.wcp,
                        statistics: positionEvaluation.wcp,
                    },
                    wwr: positionEvaluation.wwr,
                    variants: [{
                        moves: nextPv,
                        wwr: positionEvaluation.wwr,
                        wcp: positionEvaluation.wcp,
                    }],
                }
            }
        }

        const sortedMoves = await this.chessDataUtils.fetchMoves(play, 'us', ratings, speeds).then(Moves.sortByWinRate.bind(this, sideToMove));
        const totalMoveOccurrences = Moves.totalOccurrences(sortedMoves);
        let moves: MoveData[] = [];
        const moveEvaluations: { [key: string]: Evaluation[] | undefined } = {};
        // Loop through the moves and remain first MOVES_TO_CONSIDER with evaluation > MIN_EVAL_DIFF_TO_CONSIDER
        const chess = new Chess.Chess(fen);
        for (const move of sortedMoves) {
            // Increase number moves to consider if we're at the root node
            const isRootMove = probability === 1;
            if (moves.length >= MOVES_TO_CONSIDER + (isRootMove ? ADDITIONAL_MOVES_AT_ROOT : 0)) {
                break;
            }
            const moveFrequency = Moves.moveOccurrences(move) / totalMoveOccurrences;
            if (moveFrequency < MIN_FREQUENCY_TO_CONSIDER) {
                continue;
            }
            chess.move(move.san);
            if (chess.isCheckmate()) {
                moves = [move];
                moveEvaluations[move.san] = [{
                    wcp: sign * INF_CP,
                    wwr: sideToMove === 'white' ? 1 : 0,
                    bestSequence: [move],
                    bestMove: move,
                    probability: 1,
                }];
                chess.undo();
                console.log(`Found mate move in ${[...play, move].map(move => move.san).join(' ')}`);
                break;
            }
            chess.undo();
            const evaluation = await this.evaluate(probability, [...play, move], BEFORE_OPP_MOVE_EVALUATION_MULTIPV);
            moveEvaluations[move.san] = evaluation;
            if (evaluation?.[0] && positionEvaluation) {
                if (sign * (evaluation[0].wcp - positionEvaluation.wcp) >= MIN_EVAL_DIFF_TO_CONSIDER) {
                    moves.push(move);
                }
            }
        }

        // Re-sort fetched moves by popularity to find common traps for us
        let popularBlunderSequences: Variant[] = [];
        Moves.sortByPopularity(sortedMoves);
        for (const move of sortedMoves) {
            if (Moves.moveOccurrences(move) < totalMoveOccurrences * CONSIDER_SOLID_MOVE_PROB) {
                break;
            }
            if (!moves.includes(move)) {
                let evaluation = moveEvaluations[move.san];
                if (evaluation === undefined) {
                    evaluation = await this.evaluate(probability, [...play, move], BEFORE_OPP_MOVE_EVALUATION_MULTIPV);
                    moveEvaluations[move.san] = evaluation;
                } else {
                    console.log(`Local evaluation (1) cache hit for ${[...play, move].map(move => move.san).join(' ')}`);
                }
                if (evaluation?.[0] && positionEvaluation) {
                    const signedDiff = sign * (evaluation[0].wcp - positionEvaluation.wcp);
                    if (signedDiff < MIN_EVAL_DIFF_TO_CONSIDER) {
                        if (evaluation[0].bestSequence.length !== 0) {
                            Lichess.addPopularBlunderSequence(evaluation, play, move, popularBlunderSequences, signedDiff);
                            console.log(`Removed: ${[...play, move].map(move => move.san).join(' ')} occurs ${(Moves.moveOccurrences(move) / totalMoveOccurrences * 100).toFixed(1)}%`);
                        }
                    } else if (signedDiff >= 0) {
                        moves.push(move);
                        console.log(`Added: ${[...play, move].map(move => move.san).join(' ')} occurs ${(Moves.moveOccurrences(move) / totalMoveOccurrences * 100).toFixed(1)}%`);
                    }
                }
            }
        }

        let bestScore: Score = {wcp: sign * -Infinity, wwr: sideToMove === 'white' ? BLACK_WIN_RATE : WHITE_WIN_RATE};
        let bestVariants: Variant[] = [];
        const isOurBestMoveLessPopular = positionEvaluations?.length === BEFORE_OUR_MOVE_EVALUATION_MULTIPV
            && sortedMoves.findIndex(move => move.uci === positionEvaluations[0].bestMove.uci) !== 0;

        for (const move of moves) {
            const nextPlay = [...play, move];
            const allOpponentMoves = await this.chessDataUtils.fetchMoves(nextPlay, 'they', ratings, speeds).then(Moves.sortByWinRate.bind(this, sideToMove));
            // Filter out moves that are too rare
            const totalOppMoveOccurrences = Moves.totalOccurrences(allOpponentMoves);
            const opponentMoves = allOpponentMoves.filter(move => Moves.moveOccurrences(move) >= totalOppMoveOccurrences * SKIP_OPP_MOVES_WITH_PROB);

            let scores: Score[] = [];
            let nextVariants: Variant[] = [];
            let uncoveredProb = 1;
            const moveEvaluation: Evaluation[] = moveEvaluations[move.san]!;

            if (isOurBestMoveLessPopular && positionEvaluations[0].bestMove.uci === move.uci) {
                const signedDiff: number = sign * (positionEvaluations[0].wcp - positionEvaluations[1].wcp);
                const moveFrequency = Moves.moveOccurrences(move) / totalMoveOccurrences;
                Lichess.annotateGoodMoves(move, moveFrequency, signedDiff);
            }
            const significance = Math.min(Math.abs(DUBIOUS_MOVE_DIFF), Math.abs(INTERESTING_MOVE_DIFF));
            const oppBestMoveAdvantage = moveEvaluation.length === BEFORE_OPP_MOVE_EVALUATION_MULTIPV
                ? sign * moveEvaluation[1].wcp - sign * moveEvaluation[0].wcp
                : -Infinity;
            const isOppBestMoveSignificantlyBetter = oppBestMoveAdvantage > significance;

            if (popularBlunderSequences.length > 0) {
                move.popularBlunderSequences = popularBlunderSequences;
            }

            for (const opponentMove of opponentMoves) {
                const nextNextPlay = [...nextPlay, opponentMove];
                const nextNextFen = ChessUtils.playToFEN(nextNextPlay);
                const moveFrequency = Moves.moveOccurrences(opponentMove) / totalOppMoveOccurrences;
                uncoveredProb -= moveFrequency;
                let nextProbability = probability * moveFrequency;
                // Do not go deeper if the frequency is too low
                if (totalOppMoveOccurrences === 1) {
                    nextProbability = 0;
                }
                const result: SearchResults = await this.search(nextProbability, ply + 2, nextNextPlay, [...positions, fenKey], startMoves, nextNextFen, setShapes, incrementProgress, ratings, speeds);
                const wcp: number = result.wcp.statistics;
                const wwr: number = result.wwr;
                scores.push({wcp: wcp * moveFrequency, wwr: wwr * moveFrequency});

                if (opponentMove.uci === moveEvaluation[0].bestMove.uci) {
                    if (isOppBestMoveSignificantlyBetter) {
                        Lichess.annotateGoodMoves(opponentMove, moveFrequency, oppBestMoveAdvantage);
                    }
                } else if (result.wcp.engine) {
                    const signedDiff: number = -sign * (result.wcp.engine - moveEvaluation[0].wcp); // -sign because we're looking at the opponent's perspective
                    Lichess.annotateMistakeMoves(opponentMove, signedDiff);
                }

                if (result.variants.length === 0) {
                    nextVariants.push({
                        moves: [move, opponentMove],
                        wwr: wwr,
                        wcp: wcp
                    });
                } else {
                    for (const variant of result.variants) {
                        const nextPv = variant.moves;
                        nextVariants.push({
                            moves: [move, opponentMove].concat(nextPv),
                            wwr: variant.wwr,
                            wcp: variant.wcp
                        });
                    }
                }
            }

            if (uncoveredProb > 0) {
                if (moveEvaluation[0]) {
                    scores.push({
                        wcp: uncoveredProb * moveEvaluation[0].wcp,
                        wwr: uncoveredProb * moveEvaluation[0].wwr
                    });
                }
            }
            const score = scores.reduce((a, b) => ({wcp: a.wcp + b.wcp, wwr: a.wwr + b.wwr}), {wcp: 0, wwr: 0});
            if (sign * score.wwr > sign * bestScore.wwr) {
                bestScore = score;
                bestVariants = nextVariants;
            }
        }

        const result: SearchResults = {
            wcp: {
                statistics: bestScore.wcp,
                engine: positionEvaluation?.wcp,
            },
            wwr: bestScore.wwr,
            variants: bestVariants
        };
        this.cacheManager.cacheTransposition(fenKey, result);

        return result;
    }

    static addPopularBlunderSequence(evaluation: Evaluation[], play: MoveData[], candidateMove: MoveData, popularBlunderSequences: Variant[], signedDiff: number) {
        const bestSequence = evaluation[0].bestSequence.length % 2 === 0 ? evaluation[0].bestSequence.slice(0, -1) : evaluation[0].bestSequence;
        const chess = new Chess.Chess();

        play.forEach(move => chess.move(move.san));
        const initialMaterial = ChessUtils.getMaterialValueCP(chess);
        chess.move(candidateMove.san);

        const oppColor = chess.turn();
        const ourColor = oppColor === 'w' ? 'b' : 'w';
        let stopAtMove = bestSequence.length;

        // Simplified calculation of pawn threads that doesn't take into account possible pins
        let pawnThreatenedOpponentPiece = false;

        for (let i = 0; i < bestSequence.length - 1; i += 2) {
            stopAtMove = i + 1;
            const oppMove = bestSequence[i];
            const ourMove = bestSequence[i + 1];

            if (ChessUtils.isCaptureMove(oppMove) || pawnThreatenedOpponentPiece) {
                chess.move(oppMove.san);
                chess.move(ourMove.san);
                const afterValue = ChessUtils.getMaterialValueCP(chess);

                if ((oppColor === 'w' && afterValue > initialMaterial + Math.abs(signedDiff) / 2)
                    || (oppColor === 'b' && afterValue < initialMaterial - Math.abs(signedDiff) / 2)) {

                    if (!pawnThreatenedOpponentPiece && ChessUtils.pawnsThreatenOpponentPiece(chess, ourColor)) {
                        pawnThreatenedOpponentPiece = true;
                        continue;
                    }
                    break;
                }

            } else {
                chess.move(oppMove.san);
                chess.move(ourMove.san);
            }
        }

        const oppResponse = bestSequence.slice(0, stopAtMove);

        this.annotateMistakeMoves(candidateMove, signedDiff);

        popularBlunderSequences.push({
            moves: [candidateMove, ...oppResponse],
            wwr: evaluation[0].wwr,
            wcp: evaluation[0].wcp
        });
    }

    async countLeafNodes(probability: number, ply: number, play: MoveData[], positions: FENKey[], startMoves: number, fen: string, ratings: Rating[], speeds: ExplorerSpeed[]): Promise<number> {
        const fenKey: FENKey = fen.split(' ').slice(0, 4).join(' '); // key components of FEN

        // Exit condition: repetition
        if (positions.indexOf(fenKey) !== -1) {
            return 1;
        }
        // Exit condition: probability too low
        if (probability < STOP_AT_ACCUMULATED_PROB) {
            return 1;
        }

        const sideToMove = ply % 2 === 0 ? 'white' : 'black';
        const sortedMoves = await this.chessDataUtils.fetchMoves(play, 'us', ratings, speeds).then(Moves.sortByWinRate.bind(this, sideToMove));
        const totalMoveOccurrences = Moves.totalOccurrences(sortedMoves);

        let moveCount = 0;
        const chess = new Chess.Chess(fen);
        for (const move of sortedMoves) {
            // Increase number moves to consider if we're at the root node
            const isRootMove = probability === 1;
            if (moveCount >= MOVES_TO_CONSIDER + (isRootMove ? ADDITIONAL_MOVES_AT_ROOT : 0)) {
                break;
            }
            const moveFrequency = Moves.moveOccurrences(move) / totalMoveOccurrences;
            if (moveFrequency < MIN_FREQUENCY_TO_CONSIDER) {
                continue;
            }
            chess.move(move.san);
            if (chess.isCheckmate()) {
                chess.undo();
                moveCount++;
                break;
            }
            chess.undo();
            moveCount++;
        }

        let leafCount = 0;

        for (let i = 0; i < moveCount; i++) {
            const move = sortedMoves[i];
            const nextPlay = [...play, move];
            const allOpponentMoves = await this.chessDataUtils.fetchMoves(nextPlay, 'they', ratings, speeds).then(Moves.sortByWinRate.bind(this, sideToMove));
            const totalOppMoveOccurrences = Moves.totalOccurrences(allOpponentMoves);
            const opponentMoves = allOpponentMoves.filter(move => Moves.moveOccurrences(move) >= totalOppMoveOccurrences * SKIP_OPP_MOVES_WITH_PROB);
            for (const opponentMove of opponentMoves) {
                const opponentMoveFrequency = Moves.moveOccurrences(opponentMove) / totalOppMoveOccurrences;
                const adjustedProbability = probability * opponentMoveFrequency;
                const nextNextPlay = [...nextPlay, opponentMove];
                const nextNextFen = ChessUtils.playToFEN(nextNextPlay);
                leafCount += await this.countLeafNodes(adjustedProbability, ply + 2, nextNextPlay, [...positions, fenKey], startMoves, nextNextFen, ratings, speeds);
            }
        }

        return leafCount;
    }


    /**
     * Evaluate a position using the Lichess cloud engine or the local Stockfish engine.
     *
     * @param probability probability of the position occurring by taking into account only opponent moves
     * @param play moves since the start of the game
     * @param multiPV number of best moves to return
     * @param fen FEN of the position to evaluate
     * @returns evaluation in centipawns and the best move
     */
    async evaluate(probability: number, play: MoveData[], multiPV: number, fen?: string): Promise<Evaluation[] | undefined> {
        if (!fen) {
            fen = ChessUtils.playToFEN(play);
        }

        const chess = new Chess.Chess(fen);
        if (chess.isCheckmate()) {
            throw new Error("Cannot evaluate a checkmate position");
        }

        const cached = this.cacheManager.getEvaluation(fen);
        if (cached) {
            return cached;
        }

        const response = await NetworkRequestUtils.fetchWithRetry(CLOUD_EVAL + `?fen=${encodeURIComponent(fen)}&multiPv=${multiPV}`, this.lichessAccessToken, true, {method: 'GET'});

        if (!response.ok) {
            console.log(" -");
            return undefined;
        }

        const json = await response.json();

        // console.log(JSON.stringify(json));

        if (!json.pvs || json.pvs.length === 0) {
            console.log(" --");
            console.log(JSON.stringify(json));
            return undefined;
        }

        const evaluations: Evaluation[] = [];
        const sideToMove = play.length % 2 === 0 ? 'white' : 'black';

        for (const pv of json.pvs) {
            const uciMoves: string[] = pv.moves.split(" ");
            const chess = new Chess.Chess(fen);

            let cp: number;
            let white: number;
            let black: number;
            let draws: number = 0;

            if (pv.mate) {
                cp = pv.mate > 0 ? INF_CP : -INF_CP;
                if (sideToMove === 'white') {
                    white = pv.mate > 0 ? WHITE_WIN_RATE : BLACK_WIN_RATE;
                    black = pv.mate < 0 ? WHITE_WIN_RATE : BLACK_WIN_RATE;
                } else {
                    white = pv.mate < 0 ? WHITE_WIN_RATE : BLACK_WIN_RATE;
                    black = pv.mate > 0 ? WHITE_WIN_RATE : BLACK_WIN_RATE;
                }

                console.log(`Mate in ${pv.mate} (${pv.mate > 0 ? 'white' : 'black'} to move)`);
                console.log(`   fen: ${fen}`);

            } else {
                cp = Math.max(-INF_CP, Math.min(INF_CP, pv.cp));
                const wcp = sideToMove === 'white' ? cp : -cp;
                white = ChessUtils.expectedWinsPer1000(wcp, play.length);
                black = ChessUtils.expectedWinsPer1000(-wcp, play.length);
                draws = 1000 - white - black;
            }

            const bestSequence: MoveData[] = uciMoves.map(uciMove => {
                const sanMove: SAN = ChessUtils.uciToSan(chess, uciMove);
                return {san: sanMove, uci: uciMove, white, black, draws, averageRating: 2000};
            });

            evaluations.push({
                wcp: sideToMove === 'white' ? cp : -cp,
                wwr: (white + draws / 2),
                bestMove: bestSequence[0],
                bestSequence: bestSequence,
                probability: probability,
            });
        }

        console.log(`${play.map(move => move.san).join(' ')} > ${evaluations[0].wcp} cp (${(evaluations[0].wwr / 10).toFixed(1)}%), occurs ${(evaluations[0].probability * 100).toFixed(1)}%`);
        this.cacheManager.cacheEvaluation(fen, evaluations);
        return evaluations;
    }

    static annotateGoodMoves(move: MoveData, moveFrequency: number, advantage: number): void {
        if (moveFrequency < BRILLIANT_MOVE_THRESHOLD && advantage > BRILLIANT_MOVE_DIFF) {
            move.annotation = '!!';
        } else if (moveFrequency < GOOD_MOVE_THRESHOLD && advantage > GOOD_MOVE_DIFF) {
            move.annotation = '!';
        } else if (moveFrequency < INTERESTING_MOVE_THRESHOLD && advantage > INTERESTING_MOVE_DIFF) {
            move.annotation = '!?';
        }
    }

    static annotateMistakeMoves(move: MoveData, signedDiff: number): void {
        if (signedDiff < BLUNDER_MOVE_DIFF) {
            move.annotation = '??';
        } else if (signedDiff < MISTAKE_MOVE_DIFF) {
            move.annotation = '?';
        } else if (signedDiff < DUBIOUS_MOVE_DIFF) {
            move.annotation = '?!';
        }
    }
}

export type {Evaluation, MoveData, SearchResults, Variant};
export default Lichess;
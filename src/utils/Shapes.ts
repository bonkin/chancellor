import {DrawShape} from "chessground/draw";
import * as cg from "chessground/types";
import ChessUtils from "./ChessUtils";
import {Evaluation, MoveData} from "../logic/Lichess";

class Shapes {
    static createShapes(play: MoveData[], positionEvaluation: Evaluation, startMoves: number, sign: number): DrawShape[] {
        const moves: Array<{
            move: MoveData,
            piece: { role: cg.Role, color: cg.Color }
        }> = ChessUtils.playToMoves(play);

        return moves.slice(startMoves, startMoves + 6).map(({move, piece}, index) => {
            const color = (index % 2 === 0)
                ? sign * positionEvaluation.wcp > +50 ? 'blue' : 'green'
                : sign * positionEvaluation.wcp < -50 ? 'red' : 'yellow';
            const opacity = 1 - (index / 10);
            const lineWidth = 10 - index;

            return {
                orig: move.uci.substring(0, 2) as cg.Key,
                dest: move.uci.substring(2, 4) as cg.Key,
                brush: color,
                modifiers: {
                    lineWidth: lineWidth > 0 ? lineWidth : 1,
                },
                piece: {
                    ...piece,
                    scale: opacity,
                },
            };
        });
    }
}

export default Shapes;
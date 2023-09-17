import ChessUtils from "./ChessUtils";
import {Variant} from "../logic/Lichess";

class PgnUtils {

    static writeMoves(variant: Variant, startIndex: number = 0): string {
        let line = variant.moves.map((move, i) => {
            let san = `${move.san}${move.annotation || ''}`;
            const blunders = move.popularBlunderSequences;
            if (blunders?.length) {
                san += ` ${blunders.map(subVariant => `(${PgnUtils.writeMoves(subVariant, startIndex + i)})`).join('')}`;
            }
            return ((startIndex + i) % 2 === 0 ? `${((startIndex + i) / 2) + 1}.${san}` : san);
        }).join(' ');
        if (!ChessUtils.isCheckmateMove(variant.moves[variant.moves.length - 1])) {
            line += ` ${ChessUtils.getGameResult(variant.wcp)}`;
        }

        return startIndex % 2 === 1 ? `${Math.floor(startIndex / 2) + 1}...${line}` : line;
    }
}

export default PgnUtils;
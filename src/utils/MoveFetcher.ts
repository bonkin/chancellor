import {Evaluation, MoveData} from "../logic/Lichess";
import NetworkRequestUtils from "./NetworkRequestUtils";
import Moves from "./Moves";


const DATABASE_EXPLORER = process.env.REACT_APP_DATABASE_EXPLORER || 'http://localhost:9002/lichess';

class MoveFetcher {

    private readonly lichessAccessToken: string;

    constructor(lichessAccessToken: string) {
        this.lichessAccessToken = lichessAccessToken;
    }

    async fetchMoves(play: MoveData[], sideToMove: 'us' | 'they'): Promise<MoveData[]> {
        const ratings = sideToMove === 'us' ? '2000,2200,2500' : '1600,1800,2000,2200,2500';
        const speeds = sideToMove === 'us' ? 'bullet,blitz,rapid,classical,correspondence' : 'ultraBullet,bullet,blitz,rapid,classical';
        const url = `${DATABASE_EXPLORER}?variant=standard&topGames=0&recentGames=0&speeds=${speeds}&ratings=${ratings}&play=${play.map(move => move.uci).join(',')}`;
        const response = await NetworkRequestUtils.fetchWithRetry(url, this.lichessAccessToken, false, {method: 'GET'});

        const data = await response.json();
        return data["moves"];
    }

    async fetchOpeningName(uciMoves: string[]): Promise<string> {
        const url = `${DATABASE_EXPLORER}?variant=standard&speeds=&ratings=&topGames=0&recentGames=0&play=${uciMoves.join(',')}`;
        const response = await NetworkRequestUtils.fetchWithRetry(url, this.lichessAccessToken, false, {method: 'GET'});

        const data = await response.json();
        return data["opening"]["name"];
    }

    async fetchSingleResponseMovesPv(positionEvaluation: Evaluation, clearBestMoveProb: number, play: MoveData[]) {
        let nextPv: MoveData[] = [];
        let pvIndex = 0;
        let continueAdding = pvIndex < positionEvaluation.bestSequence.length;
        while (continueAdding) {
            nextPv.push(positionEvaluation.bestSequence[pvIndex]);
            continueAdding = pvIndex + 2 < positionEvaluation.bestSequence.length && await this.fetchMoves([...play, ...nextPv], 'they').then(moves => {
                if (moves.length === 0) {
                    return false;
                }
                Moves.sortByPopularity(moves);
                const totalOccurrences = Moves.totalOccurrences(moves);
                const moveOccurrences = Moves.moveOccurrences(moves[0]);
                return moveOccurrences > 1
                    && moveOccurrences >= totalOccurrences * clearBestMoveProb
                    && moves[0].uci === positionEvaluation.bestSequence[pvIndex + 1].uci;
            }).catch(error => {
                console.error("An error occurred while fetching next PV moves", error);
                return false;
            });
            if (continueAdding) {
                nextPv.push(positionEvaluation.bestSequence[pvIndex + 1]);
                pvIndex += 2;
            }
        }
        return nextPv;
    }

}

export default MoveFetcher;

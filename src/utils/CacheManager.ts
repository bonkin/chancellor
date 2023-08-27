import {Evaluation, FENKey, SearchResults} from "../logic/Lichess";

class CacheManager {
    transpositions: Map<FENKey, SearchResults>;
    evaluations: Map<FENKey, Evaluation[]>;

    constructor() {
        this.transpositions = new Map();
        this.evaluations = new Map();
    }

    cacheTransposition(fenKey: FENKey, data: SearchResults) {
        this.transpositions.set(fenKey, data);
    }

    cacheEvaluation(fen: FENKey, evaluations: Evaluation[]) {
        this.evaluations.set(fen, evaluations);
    }

    getTransposition(fenKey: FENKey): SearchResults | undefined {
        const cached = this.transpositions.get(fenKey);
        if (cached) {
            console.log(`Transposition cache hit for ${fenKey}`);
        }
        return cached;
    }

    getEvaluation(fenKey: FENKey): Evaluation[] | undefined {
        const cached = this.evaluations.get(fenKey);
        if (cached) {
            console.log(`Evaluation cache hit for ${fenKey}`);
        }
        return cached;
    }
}

export default CacheManager;


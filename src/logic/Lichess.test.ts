import "@testing-library/jest-dom/extend-expect";
import Lichess, { Annotation, Evaluation, MoveData, Variant } from "./Lichess";

describe("addPopularBlunderSequence", () => {

    const toMoveData = (m: { uci: string; san: string }): MoveData => ({
        ...m,
        averageRating: 1500,
        white: 30,
        draws: 50,
        black: 20
    });

    const testCases = [
        {
            fen: "r1bqk2r/pp1pppbp/2n2np1/1B4B1/Q3P3/5N2/PPP2PPP/RN2K2R b KQkq - 3 7",
            startingMoves: [
                {uci: "e2e4", san: "e4"},
                {uci: "c7c5", san: "c5"},
                {uci: "d2d4", san: "d4"},
                {uci: "c5d4", san: "cxd4"},
                {uci: "d1d4", san: "Qxd4"},
                {uci: "b8c6", san: "Nc6"},
                {uci: "d4a4", san: "Qa4"},
                {uci: "g8f6", san: "Nf6"},
                {uci: "f1b5", san: "Bb5"},
                {uci: "g7g6", san: "g6"},
                {uci: "g1f3", san: "Nf3"},
                {uci: "f8g7", san: "Bg7"},
            ].map(toMoveData),
            candidateMove: toMoveData({uci: "c1g5", san: "Bg5"}),
            // r . b q k . . r
            // p p . p p p b p
            // . . n . . n p .
            // . B . . . . B .
            // Q . . . P . . .
            // . . . . . N . .
            // P P P . . P P P
            // R N . . K . . R
            bestSequence: [
                {uci: "f6e4", san: "Nxe4"},
                {uci: "a4e4", san: "Qxe4"},
                {uci: "f8b2", san: "Bxb2"},
                {uci: "c2c3", san: "c3"},
                {uci: "b2a1", san: "Bxa1"},
                {uci: "e1g1", san: "O-O"},
                {uci: "e8g8", san: "O-O"},
                {uci: "g5h6", san: "Bh6"},
                {uci: "f8e8", san: "Re8"},
                {uci: "fe35", san: "Nf5"},
            ].map(toMoveData),
            signedDiff: -100,
            expectedSequence: [
                {uci: "c1g5", san: "Bg5"},
                {uci: "g8e4", san: "Nxe4"},
                {uci: "a4e4", san: "Qxe4"},
                {uci: "f8b2", san: "Bxb2"},
                {uci: "c2c3", san: "c3"},
                {uci: "b2a1", san: "Bxa1"},
            ].map(toMoveData)
        },
        {
            fen: "r1bqk1nr/pp1p1pbp/2n1p1p1/4P3/Q7/2N2N2/PPP2PPP/R1B1KB1R b KQkq - 0 7",
            startingMoves: [
                {uci: "e2e4", san: "e4"},
                {uci: "c7c5", san: "c5"},
                {uci: "d2d4", san: "d4"},
                {uci: "c5d4", san: "cxd4"},
                {uci: "d1d4", san: "Qxd4"},
                {uci: "b8c6", san: "Nc6"},
                {uci: "d4a4", san: "Qa4"},
                {uci: "g7g6", san: "g6"},
                {uci: "g1f3", san: "Nf3"},
                {uci: "f8g7", san: "Bg7"},
                {uci: "b1c3", san: "Nc3"},
                {uci: "e7e6", san: "e6"},
            ].map(toMoveData),
            candidateMove: toMoveData({uci: "e4e5", san: "e5"}),
            // r . b q k . n r
            // p p . p . p b p
            // . . n . p . p .
            // . . . . P . . .
            // Q . . . . . . .
            // . . N . . N . .
            // P P P . . P P P
            // R . B . K B . R
            bestSequence: [
                {uci: "c6e5", san: "Nxe5"},
                {uci: "f3e5", san: "Nxe5"},
                {uci: "g7e5", san: "Bxe5"},
                {uci: "c1f4", san: "Bf4"},
                {uci: "e5f4", san: "Bxf4"},
                {uci: "a4f4", san: "Qxf4"},
                {uci: "g8f6", san: "Nf6"},
            ].map(toMoveData),
            signedDiff: -100,
            expectedSequence: [
                {uci: "e4e5", san: "e5"},
                {uci: "c6e5", san: "Nxe5"},
                {uci: "f3e5", san: "Nxe5"},
                {uci: "g7e5", san: "Bxe5"},
            ].map(toMoveData)
        },
        {
            fen: "r2qkb1r/1p1bpppp/p1np1n2/1B1N4/Q3P3/5N2/PPP2PPP/R1B1K2R",
            startingMoves: [
                {uci: "e2e4", san: "e4"},
                {uci: "c7c5", san: "c5"},
                {uci: "d2d4", san: "d4"},
                {uci: "c5d4", san: "cxd4"},
                {uci: "d1d4", san: "Qxd4"},
                {uci: "g8f6", san: "Nf6"},
                {uci: "b1c3", san: "Nc3"},
                {uci: "b8c6", san: "Nc6"},
                {uci: "d4a4", san: "Qa4"},
                {uci: "d7d6", san: "d6"},
                {uci: "g1f3", san: "Nf3"},
                {uci: "c8d7", san: "Bd7"},
                {uci: "f1b5", san: "Bb5"},
                {uci: "a7a6", san: "a6"},
            ].map(toMoveData),
            candidateMove: toMoveData({uci: "c3d5", san: "Nd5"}),
            // r n b q k . n r
            // p p p p . p p p
            // . . . . . . . .
            // . . b . . . . .
            // . . P Q . . . .
            // . . . . . . . .
            // P P . . P P P P
            // R N B . K B N R
            bestSequence: [
                {uci: "f6d5", san: "Nxd5"},
                {uci: "e4d5", san: "exd5"},
                {uci: "a6b5", san: "axb5"},
                {uci: "a4b5", san: "Qxb5"},
                {uci: "c6d4", san: "Nd4"},
                {uci: "b5d3", san: "Qd3"},
                {uci: "d4f3", san: "Nxf3+"},
                {uci: "d3f3", san: "Qxf3"}
            ].map(toMoveData),
            signedDiff: -300,
            expectedSequence: [
                {uci: "c3d5", san: "Nd5"},
                {uci: "f6d5", san: "Nxd5"},
                {uci: "e4d5", san: "exd5"},
                {uci: "a6b5", san: "axb5"},
                {uci: "a4b5", san: "Qxb5"},
                {uci: "c6d4", san: "Nd4"},
            ].map(toMoveData)
        },
        {
            fen: "rnbqk1nr/pppp1ppp/8/2b5/2PQ4/8/PP2PPPP/RNB1KBNR w KQkq - 1 4",
            startingMoves: [
                {uci: "d2d4", san: "d4"},
                {uci: "e7e5", san: "e5"},
                {uci: "c2c4", san: "c4"},
                {uci: "e5d4", san: "exd4"},
                {uci: "d1d4", san: "Qxd4"},
            ].map(toMoveData),
            candidateMove: toMoveData({uci: "f8c5", san: "Bc5"}),
            // rnbqk.nr
            // pppp.ppp
            // ........
            // ..b.....
            // ..PQ....
            // ........
            // PP..PPPP
            // RNB.KBNR
            bestSequence: [
                {uci: "d4c5", san: "Qxc5"},
                {uci: "g8e7", san: "Ne7"},
                {uci: "b1c3", san: "Nc3"},
                {uci: "b8c6", san: "Nc6"},
            ].map(toMoveData),
            signedDiff: -300,
            expectedSequence: [
                {uci: "f8c5", san: "Bc5"},
                {uci: "d4c5", san: "Qxc5"},
            ].map(toMoveData)
        },
    ];

    testCases.forEach(testCase => {
        it(testCase.fen, () => {
            const popularBlunderSequences: Variant[] = [];

            const evaluation: Evaluation[] = [
                {
                    bestSequence: testCase.bestSequence,
                    wwr: 450,
                    wcp: -200,
                    bestMove: testCase.bestSequence[0],
                    probability: 0.5,
                }
            ];

            Lichess.addPopularBlunderSequence(evaluation, testCase.startingMoves, testCase.candidateMove, popularBlunderSequences, testCase.signedDiff);
            testCase.candidateMove.annotation = '?!';
            expect(popularBlunderSequences[0].moves).toStrictEqual([testCase.candidateMove, ...testCase.bestSequence].slice(0, testCase.expectedSequence.length));
        });
    });
});

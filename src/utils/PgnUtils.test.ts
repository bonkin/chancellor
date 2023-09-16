import "@testing-library/jest-dom/extend-expect";
import {Annotation, MoveData, Variant} from "../logic/Lichess";
import {DRAW_WIN_RATE} from "./ChessUtils";
import PgnUtils from "./PgnUtils";

describe('writeMoves function', function() {

    const m = (m: { uci: string; san: string, annotation?: Annotation, popularBlunderSequences?: Variant[] }): MoveData => ({
        ...m,
        averageRating: 1500,
        white: 30,
        draws: 50,
        black: 20,
        annotation: m.annotation,
        popularBlunderSequences: m.popularBlunderSequences
    });

    const testCases: {
        variant: Variant;
        expectedOutput: string
    }[] = [
        {
            variant: {
                moves: [
                    m({san: 'd4', uci: 'd2d4'}),
                    m({san: 'e5', uci: 'e7e5'}),
                    m({san: 'c4', uci: 'c2c4', annotation: '?'}),
                    m({san: 'exd4', uci: 'e5d4',
                        popularBlunderSequences: [
                            {
                                moves: [
                                    m({san: 'Bc5', uci: 'f1c4', annotation: '??'}),
                                    m({san: 'dxc5', uci: 'd4c5'}),
                                    m({san: 'Na6', uci: 'b8a6'}),
                                    m({san: 'Nf3', uci: 'g1f3'}),
                                    m({san: 'e4', uci: 'e2e4'}),
                                    m({san: 'Nd4', uci: 'f3d4'}),
                                    m({san: 'Nxc5', uci: 'd4c5'}),
                                    m({san: 'Nc3', uci: 'b1c3'}),
                                    m({san: 'Nf6', uci: 'g8f6'}),
                                    m({san: 'Nc2', uci: 'b1c2'}),
                                ],
                                wwr: 600,
                                wcp: 350,
                            }
                        ]
                    }),
                    m({san: 'Nf3', uci: 'g1f3'}),
                    m({san: 'Nc6', uci: 'b8c6'}),
                    m({san: 'Nxd4', uci: 'f3d4'}),
                    m({san: 'Qf6', uci: 'd8f6'}),
                ],
                wwr: DRAW_WIN_RATE,
                wcp: 0,
            },
            expectedOutput: '1.d4 e5 2.c4? exd4 (2...Bc5?? 3.dxc5 Na6 4.Nf3 e4 5.Nd4 Nxc5 6.Nc3 Nf6 7.Nc2 +-) 3.Nf3 Nc6 4.Nxd4 Qf6 =',
        },
        {
            variant: {
                moves: [
                    m({san: 'e4', uci: 'e2e4'}),
                    m({san: 'c5', uci: 'c7c5'}),
                    m({san: 'd4', uci: 'd2d4'}),
                    m({san: 'Nc6', uci: 'b8c6', annotation: '?'}),
                    m({san: 'd5', uci: 'd4d5',
                        popularBlunderSequences: [
                            {
                                moves: [
                                    m({san: 'Nf3', uci: 'g1f3', annotation: '?'}),
                                    m({san: 'cxd4', uci: 'c5d4'}),
                                    m({san: 'Nxd4', uci: 'f3d4'}),
                                    m({san: 'Nf6', uci: 'g8f6'}),
                                    m({san: 'Nc3', uci: 'b1c3'}),
                                    m({san: 'e5', uci: 'e7e5'}),
                                    m({san: 'Ndb5', uci: 'd4b5'}),
                                    m({san: 'd6', uci: 'd7d6'}),
                                    ],
                                wwr: 500,
                                wcp: 0,
                            },
                        ],
                    }),
                    m({san: 'Ne5', uci: 'c6e5', annotation: '?!'}),
                    m({san: 'f4', uci: 'f2f4'}),
                    ],
                wwr: DRAW_WIN_RATE,
                wcp: 0,
            },
            expectedOutput: '1.e4 c5 2.d4 Nc6? 3.d5 (3.Nf3? cxd4 4.Nxd4 Nf6 5.Nc3 e5 6.Ndb5 d6 =) Ne5?! 4.f4 =',
        },
    ];

    testCases.forEach(testCase => {
        it(testCase.expectedOutput, () => {
            const result = PgnUtils.writeMoves(testCase.variant);
            expect(result).toBe(testCase.expectedOutput);
        });
    });

});

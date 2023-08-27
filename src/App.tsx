import React from 'react';
import './App.css';
import {OAuth2AuthCodePKCE} from "@bity/oauth2-auth-code-pkce";
import {getCookie} from 'typescript-cookie'
import Lichess, {Evaluation, MoveData, Variant} from "./logic/Lichess";
import Board from "./Board";
// @ts-ignore
import './chessground/assets/chessground.base.css';
import './chessground/assets/chessground.brown.css';
import './chessground/assets/chessground.cburnett.css';
import {DrawShape} from "chessground/draw";
import {Api} from "chessground/api";
import ChessUtils, {WHITE_WIN_RATE} from "./utils/ChessUtils";
import MoveFetcher from "./utils/MoveFetcher";
import SavePgnButton from "./SavePgnButton";
import throttle from 'lodash/throttle';
import TimeFormatter from "./utils/TimeFormatter";
import VariantTile from "./VariantTile";
import User from "./User";
import Moves from "./utils/Moves";
import {QueryButton} from "./QueryButton";


export enum LichessLoginState {
    LoggedIn,
    Pending,
    LoggedOut,
    Error
}

interface AppState {
    lichessLoginState: LichessLoginState;
    lichessLoginName?: string;
    oauth: OAuth2AuthCodePKCE;
    fen: string; // The state to hold the FEN representation of the board state
    drawable: { shapes: any[] };
    currentMoves: MoveData[];
    variants: Variant[];
    openingName: string;
    progress: number;
    estimatedLeaves: number;
    isCalculating: boolean;
    calculationStartTime: number;
    searchForColor: 'white' | 'black' | 'default';
}

interface MoveFrequency {
    move: MoveData;
    frequency: number;
}

class App extends React.Component<any, AppState> {
    // private socket: StrongSocket; // WebSocket instance

    private boardApi?: Api;

    state: AppState;
    private throttledEstimateTime: _.DebouncedFunc<() => string>;
    private moveFetcher: MoveFetcher;

    constructor(props: any) {
        super(props)
        this.state = {
            lichessLoginState: LichessLoginState.LoggedOut,
            oauth: new OAuth2AuthCodePKCE({
                authorizationUrl: 'https://lichess.org/oauth',
                tokenUrl: 'https://lichess.org/api/token',
                clientId: 'chancellor-chess-app',
                scopes: [],
                redirectUrl: `${window.location.href}?source=lichess`,
                onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
                onInvalidGrant: _retry => {
                },
            }),
            fen: 'start', // This will hold the FEN representation of the board state
            drawable: {shapes: []},
            currentMoves: [],
            variants: [],
            openingName: 'Starting Position',
            progress: 0,
            estimatedLeaves: 0,
            isCalculating: false,
            calculationStartTime: 0,
            searchForColor: 'default',
        }

        this.throttledEstimateTime = throttle(this.estimateTimeRemaining, 5000);
        this.handleUserStatusChanged = this.handleUserStatusChanged.bind(this)
        this.logInToLichess = this.logInToLichess.bind(this)
        this.logOutOfLichess = this.logOutOfLichess.bind(this)
        this.queryTree = this.queryTree.bind(this);
        this.incrementProgress = this.incrementProgress.bind(this);
        this.drawMoves = this.drawMoves.bind(this);
        this.handleMoveClick = this.handleMoveClick.bind(this);
        this.boardApi = undefined;

        this.moveFetcher = new MoveFetcher("");
    }

    updateCurrentMoves = (newMoves: MoveData[]) => {
        this.setState({currentMoves: newMoves});

        this.moveFetcher.fetchOpeningName(newMoves.map(moveData => moveData.uci)).then(openingName => {
            this.setState({openingName});
        });
    }

    logInToLichess = () => {
        this.setState({
            lichessLoginState: LichessLoginState.Pending
        });
        console.log('Before setTimeout');
        setTimeout(() => this.state.oauth.fetchAuthorizationCode.call(this.state.oauth), 1000);
        console.log('After setTimeout');
    }

    logOutOfLichess = () => {
        this.setState({
            lichessLoginState: LichessLoginState.LoggedOut
        })
    }

    handleUserStatusChanged = (state: LichessLoginState, username?: string) => {
        this.setState({
            lichessLoginState: state,
            lichessLoginName: username
        });
    }

    drawMoves = async (shapes: DrawShape[]) => {
        this.setState({
            drawable: {shapes}
        });
    }

    incrementProgress() {
        this.setState(prevState => {
            return {progress: prevState.progress + 1};
        });
    }

    estimateTimeRemaining() {
        if (!this.state.isCalculating || !this.state.calculationStartTime) return "Estimation not available";
        const elapsedMillis = Date.now() - this.state.calculationStartTime;
        const completionTimeMillis = (elapsedMillis / this.state.progress) * this.state.estimatedLeaves;
        const remainingMillis = completionTimeMillis - elapsedMillis;
        return TimeFormatter.formatTime(Math.round(remainingMillis / 1000));
    }

    async queryTree() {
        const lichessAccessToken = getCookie('lichess');
        if (lichessAccessToken) {
            const lichess = new Lichess(lichessAccessToken);
            const currentMoves = this.state.currentMoves;
            this.setState({isCalculating: true});
            this.setState({calculationStartTime: Date.now()});
            const searchForColor = this.state.searchForColor;
            let opponentMoveFrequencies: MoveFrequency[] = [];

            if (searchForColor !== 'default' && searchForColor !== (currentMoves.length % 2 === 0 ? 'white' : 'black')) {
                // Fetch possible opponent moves
                const allOpponentMoves = await lichess.chessDataUtils.fetchMoves(currentMoves, 'they');
                const totalOppMoveOccurrences = Moves.totalOccurrences(allOpponentMoves);

                // Calculate the frequency of each opponent move
                for (const opponentMove of allOpponentMoves) {
                    const moveFrequency = Moves.moveOccurrences(opponentMove) / totalOppMoveOccurrences;
                    opponentMoveFrequencies.push({move: opponentMove, frequency: moveFrequency});
                }
            }

            let scenarios: { moves: MoveData[], probability: number}[] = [];

            if (opponentMoveFrequencies.length > 0) {
                for (const moveFrequency of opponentMoveFrequencies) {
                    scenarios.push({moves: currentMoves.concat(moveFrequency.move), probability: moveFrequency.frequency});
                }
            } else {
                scenarios.push({moves: currentMoves, probability: 1});
            }

            let allVariants: Variant[] = [];

            for (const scenario of scenarios) {
                const openingName = await this.moveFetcher.fetchOpeningName(scenario.moves.map(moveData => moveData.uci));
                this.setState({openingName: openingName});

                const estimatedLeaves = await lichess.countLeafNodes(scenario.probability, scenario.moves.length, scenario.moves, [], scenario.moves.length, ChessUtils.playToFEN(scenario.moves));
                this.setState({estimatedLeaves, progress: 0}); // Set the estimation to state and reset progress

                const results = await lichess.search(scenario.probability, scenario.moves.length, scenario.moves, [], scenario.moves.length, ChessUtils.playToFEN(scenario.moves), this.drawMoves, this.incrementProgress);

                console.log('Search complete');
                console.log('Expected white cp:', parseFloat(results.wcp.statistics.toFixed(1)));
                console.log('Expected white win rate:', parseFloat(((scenario.moves.length % 2 === 0 ? results.wwr : WHITE_WIN_RATE - results.wwr) / 10).toFixed(1)));

                const avgPly = scenario.moves.length + Math.round(results.variants.reduce((acc, variant) => acc + variant.moves.length, 0) / results.variants.length);
                console.log(`Avg ply: ${avgPly}, ${scenario.moves.length % 2 === 0 ? 'White' : 'Black'} to move. Calculating derived WWR...`);
                const derivedWwr = ChessUtils.expectedPointsPer1000(results.wcp.statistics, avgPly);
                console.log(parseFloat((derivedWwr / 10).toFixed(1)));

                const newVariants: Variant[] = results.variants.map((variant, index) => {
                    const moves = scenario.moves.concat(variant.moves);
                    const fen = ChessUtils.playToFEN(moves);
                    const wcp = `${variant.wcp > 0 ? '+' : ''}${variant.wcp.toFixed(0)}`;
                    console.log(`${index + 1}. ${moves.map(move => move.san).join(' ')}, ${wcp}, ${(variant.wwr / 10).toFixed(1)}%, ${fen}`);

                    return {moves: moves, wwr: variant.wwr, wcp: variant.wcp};
                });

                allVariants = [...allVariants, ...newVariants];
                this.setState({variants: allVariants});
            }
            this.setState({isCalculating: false});
        }
    }

    clearShapes = () => {
        this.setState({
            drawable: { shapes: [] }
        });
    }

    handleMoveClick(moves: MoveData[]) {
        this.clearShapes();
        this.updateCurrentMoves(moves);
    }

    handleOptionChange = (option: 'white' | 'black' | 'default') => {
        this.setState({ searchForColor: option });
    }

    componentDidUpdate(prevProps: any, prevState: AppState) {
    }

    render() {
        return (
            <div>
                <header className="relative p-2 bg-blue-500 text-white flex justify-center items-center">
                    <div className="text-xl">{this.state.openingName}</div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <User
                            lichessLoginState={this.state.lichessLoginState}
                            lichessLoginName={this.state.lichessLoginName}
                            onUserStatusChanged={this.handleUserStatusChanged}
                            loginToLichess={this.logInToLichess}
                            logOutOfLichess={this.logOutOfLichess}
                        />
                    </div>
                </header>
                <div
                    title={this.throttledEstimateTime()}
                    className="relative pt-0">
                    <div className="overflow-hidden h-2 text-xs flex bg-transparent mb-4">
                        <div
                            style={{width: `${this.state.isCalculating ? (this.state.progress / this.state.estimatedLeaves) * 100 : this.state.estimatedLeaves ? 100 : 0}%`}}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600 ${this.state.isCalculating ? 'shimmer-effect' : ''}`}>
                        </div>
                    </div>
                </div>
                <main className="container mx-auto mt-4">
                    <div className="flex">
                        <div>
                            <Board
                                config={{drawable: this.state.drawable}}
                                onMovesUpdate={this.updateCurrentMoves}
                                externalMoves={this.state.currentMoves}
                            />
                            <div className="flex space-x-4">
                                <QueryButton
                                    onClick={this.queryTree}
                                    onOptionChange={this.handleOptionChange}
                                />
                                <SavePgnButton variants={this.state.variants} openingName={this.state.openingName} />
                            </div>
                        </div>
                        <div className="ml-4 overflow-auto" style={{maxHeight: '1000px'}}>
                            {this.state.variants.map((variant, index) => (
                                <VariantTile
                                    key={index}
                                    variant={variant}
                                    index={index}
                                    totalVariants={this.state.variants.length}
                                    onMoveClick={this.handleMoveClick}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        )
    }
}

export default App;

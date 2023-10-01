const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
app.use(cors({
    origin: 'http://127.0.0.1:3000'
}));
app.use(bodyParser.json());

// const engine = spawn('/opt/homebrew/bin/stockfish');
const numThreads = 4;
const hashMB = 16384;

const moveTime = process.argv[2] || 50;

app.get('/api/cloud-eval', function (req, res) {
    const fen = req.query.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const time = req.query.time || moveTime;
    const multipv = Number(req.query.multiPv) || 1;

    const engine = spawn("/opt/homebrew/bin/stockfish");
    const pvs = new Array(multipv).fill(null);
    let knodes = 0;
    let depth = 0;

    console.log(`query: ${fen} (${time} ms, ${multipv} pv)`);

    engine.stdin.write('setoption name Threads value ' + numThreads + '\n');
    engine.stdin.write(`setoption name MultiPV value ${multipv}\n`);
    engine.stdin.write(`setoption name Hash value ${hashMB}\n`);
    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`go movetime ${time}\n`);

    let receivedPVs = Array(multipv).fill(false);
    let listener = (data) => {
        const lines = data.toString().split('\n');

        for (const line of lines) {
            if (line.includes('info depth') && line.includes('multipv')) {
                let multipvValue = parseInt(line.split('multipv ')[1]);
                receivedPVs[multipvValue - 1] = true;
                const details = line.split(' ');
                const index = details.findIndex(e => e === 'multipv');
                if (index !== -1 && parseInt(details[index + 1]) <= multipv) {
                    const pvIndex = details.findIndex(e => e === 'pv');
                    const moves = details.slice(pvIndex + 1).join(' ');
                    let evaluation = {};
                    const cpIndex = details.findIndex(e => e === 'cp');
                    const mateIndex = details.findIndex(e => e === 'mate');
                    if (cpIndex !== -1) {
                        evaluation.cp = parseInt(details[cpIndex + 1]);
                    } else if (mateIndex !== -1) {
                        evaluation.mate = parseInt(details[mateIndex + 1]);
                    }
                    depth = parseInt(details[details.findIndex(e => e === 'depth') + 1]);
                    const nodes = parseInt(details[details.findIndex(e => e === 'nodes') + 1]);
                    knodes = Math.max(knodes, nodes / 1000); // convert to kilonodes
                    pvs[parseInt(details[index + 1]) - 1] = { moves, ...evaluation };
                }
            }

            if (line.includes('bestmove')) {
                engine.stdout.removeListener('data', listener);
                engine.kill();
                const actualPVs = pvs.filter((_, index) => receivedPVs[index]);
                res.json({ fen, knodes, depth, pvs: actualPVs });

                const evaluation = actualPVs[0]?.cp !== undefined ? `cp: ${actualPVs[0]?.cp}` : actualPVs[0]?.mate !== undefined ? `mate: ${actualPVs[0]?.mate}` : 'No valid moves';
                console.log(`   response: ${actualPVs[0].moves.split(' ').slice(0, 3).join(' ')}... (${evaluation}) Kn/s: ${knodes}, depth: ${depth}`);

            } else if (line.includes('bestmove (none)')) {
                engine.stdout.removeListener('data', listener);
                engine.kill();
                res.json({ fen, knodes, depth, error: "No legal moves available. The game is over." });
                console.log(` - response: Kn/s: ${knodes}, depth: ${depth} No legal moves available. The game is over.`);
            }
        }
    };

    engine.stdout.on('data', listener);
});

app.listen(9003, function () {
    console.log('Listening on port 9003');
});

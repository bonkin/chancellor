import concurrent.futures
import io
import re
import sys
import threading
import time

from collections import defaultdict
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Callable, TextIO, TypeVar, Optional, List

from chess.pgn import read_game, read_headers, BaseVisitor, GameT, Game, GameBuilder, SkipType, ResultT, Headers
from chess import Move, Board, COLORS, BLACK, WHITE

from chancellor.parser.conditional_visitor import ConditionalVisitor
from chancellor.parser.configuration import Configuration, STARTPOS
from chancellor.parser.position import Position
from chancellor.parser.position_tree import PositionTree

MAX_THREADS = 2


class Parser(object):
    """ Parses PGN stream and builds a tree of moves. """
    _tree: list[PositionTree]

    def __init__(self, config: Configuration):
        """ Creates a new parser.
        :param config: configuration of the parser
        """
        self._config = config
        self._tree = [PositionTree(config) for _ in range(self._config.get_max_threads())]

    def parse_pgn_games_in_parallel(self, stream: TextIO):
        """ Parses PGN stream and builds a tree of moves. """
        chunk: str = ''
        in_header = True
        in_moves = False

        with ThreadPoolExecutor(max_workers=self._config.get_max_threads()) as thread:
            for line in stream:
                chunk += line
                if line.strip() == '':
                    if in_moves:
                        thread.submit(self.parse_pgn_games, chunk)
                        # self.parse_pgn_games(io.StringIO(chunk))
                        chunk = ''
                        in_moves = False
                        in_header = True
                    elif in_header:
                        in_moves = True
                        in_header = False
            # If we have reached the end of the input and there is still an
            # unfinished chunk, process it in a separate thread
            if in_moves:
                thread.submit(self.parse_pgn_games, chunk)
                # self.parse_pgn_games(io.StringIO(chunk))

    def parse_pgn_games(self, stream: TextIO):
        """ Iterates through all the games in PGN stream and builds a tree of moves. """

        while True:
            game = read_game(stream, Visitor=lambda: ConditionalVisitor(self._config))
            if game is None:
                break
            self._parse_game(game)

    def get_tree(self) -> list[PositionTree]:
        """ Returns the tree of moves. """
        return self._tree

    def _parse_game(self, game):
        """ Parses a single game and stores data into the tree. """
        moves = []
        board = game.board()
        cur_pos = board.epd()
        thread_index = threading.get_ident() % len(self._tree)

        if cur_pos != STARTPOS:
            return

        for node in game.mainline():
            if node.clock() is not None and node.clock() < self._config.get_min_time():
                break
            if board.ply() > self._config.get_max_depth():
                break

            moves.append(node.move)
            board.push(node.move)
            prev_pos = cur_pos
            cur_pos = board.epd()
            evaluation = node.eval()

            if not self._tree[thread_index].add(
                    cur_pos=cur_pos,
                    prev_pos=prev_pos,
                    moves=[m.uci() for m in moves],
                    ply=board.ply(),
                    evaluation=evaluation,
            ):
                break


def count_empty_lines():
    count = 0
    for line in sys.stdin:
        if line.strip() == '':
            count += 1
    return count


def process_tree(tree: PositionTree) -> PositionTree:
    print(f'Total positions before:                  {tree.get_total()}')
    tree.remove_unevaluated()
    print(f'Positions after removing unevaluated:    {tree.get_total()}')
    tree.correct_probabilities(STARTPOS, 1.0)
    print(f'Total positions after removing low prob: {tree.get_total()}')
    games_saved = tree.save_variants()
    print(f'Total variants saved:                    {games_saved}')
    elapsed = time.perf_counter() - start
    print(f'Time elapsed:                            {elapsed:.2f} seconds')
    return tree


if __name__ == '__main__':
    parser = Parser(Configuration(
        max_threads=MAX_THREADS,
        max_depth=25,
        min_time=60,
        min_prob=0.1,
        opponent=BLACK,
        white_elo=range(1800, 2500),
        black_elo=range(1600, 2200),
    ))
    start = time.perf_counter()
    parser.parse_pgn_games_in_parallel(sys.stdin)
    trees: list[PositionTree] = parser.get_tree()
    results = []

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        for tree in trees:
            results.append(executor.submit(process_tree, tree))

    print(f'\nTotal positions after processing:        {sum([future.result().get_total() for future in results])}')

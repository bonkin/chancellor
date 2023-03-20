import re
import sys

from collections import defaultdict
from collections.abc import Iterator
from typing import Callable, TextIO, TypeVar, Optional

from chess.pgn import read_game
from chess import Move, Board, COLORS, BLACK, WHITE

from chancellor.parser.configuration import Configuration, STARTPOS
from chancellor.parser.position import Position
from chancellor.parser.position_tree import PositionTree


class Parser(object):
    """ Parses PGN stream and builds a tree of moves. """

    def __init__(self, config: Configuration):
        """ Creates a new parser.
        :param config: configuration of the parser
        """
        self._config = config
        self._tree = PositionTree(config)

    def parse(self, stream: TextIO):
        """ Iterates through all the games in PGN stream and builds a tree of moves. """
        while True:
            game = read_game(stream)
            if game is None:
                break
            white_elo = int(game.headers["WhiteElo"])
            black_elo = int(game.headers["BlackElo"])
            if white_elo in self._config.get_white_elo() and black_elo in self._config.get_black_elo():
                self._parse_game(game)

    def get_tree(self):
        """ Returns the tree of moves. """
        return self._tree

    def _parse_game(self, game):
        """ Parses a single game and stores data into the tree. """
        moves = []
        board = game.board()
        cur_pos = board.epd()

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

            if not self._tree.add(
                cur_pos=cur_pos,
                prev_pos=prev_pos,
                moves=[m.uci() for m in moves],
                ply=board.ply(),
                evaluation=evaluation,
            ):
                break


if __name__ == '__main__':
    parser = Parser(Configuration(
        max_depth=25,
        min_time=0,
        min_prob=0.1,
        opponent=BLACK,
        white_elo=range(1800, 2500),
        black_elo=range(1600, 2200),
    ))
    parser.parse(sys.stdin)
    tree = parser.get_tree()
    print(f'Total positions before:                     {tree.get_total()}')
    tree.remove_unevaluated()
    print(f'Total positions after removing unevaluated: {tree.get_total()}')
    tree.correct_probabilities(STARTPOS, 1.0)
    print(f'Total positions after removing low prob:    {tree.get_total()}')
    games_saved = tree.save_variants()
    print(f'Total variants saved:                       {games_saved}')



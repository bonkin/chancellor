from chess.engine import PovScore
from collections import defaultdict
from typing import Optional


class Position(object):
    """ Represents a single position in a chess game. """

    def __init__(self):
        self._possible_moves = defaultdict(lambda: 0)
        self._variants = defaultdict(lambda: 0)
        self._occurrences = 0
        self._engine_evaluation = None
        self._ply = None
        self._prob = 0.0

    def set_prob(self, prob: float):
        """ Sets the probability of the position. """
        self._prob = prob

    def add_eval(self,
                 moves: [str],
                 ply: int,
                 prob: float,
                 evaluation: Optional[PovScore]
                 ):
        """ Adds a new variant to the position. """

        self._variants[' '.join(moves)] += 1
        self._occurrences += 1
        self._ply = min(self._ply, ply) if self._ply is not None else ply
        if self._engine_evaluation is None:
            self._engine_evaluation = evaluation
        self._prob = prob

    def get_variants(self) -> dict[str, int]:
        """ Returns all variants of the position. """
        return self._variants

    def get_evaluation(self) -> PovScore:
        """ Returns the evaluation of the position. """
        return self._engine_evaluation

    def get_occurrences(self) -> int:
        """ Returns the number of occurrences of the position. """
        return self._occurrences

    def get_possible_moves(self) -> dict[str, int]:
        """ Returns all possible moves from this position. """
        return self._possible_moves

    def delete_all_moves(self):
        """ Deletes all possible moves from this position. """
        self._possible_moves = defaultdict(lambda: 0)

    def make_move(self, move: str) -> float:
        """ Makes a move from this position and returns the probability of the new position. """
        self._possible_moves[move] += 1
        return self._possible_moves[move] / self._occurrences

    def get_move_prob(self, move: str) -> float:
        """ Returns the probability of the move. """
        return self._possible_moves[move] / self._occurrences

    def get_prob(self) -> float:
        """ Returns the probability of the position. """
        return self._prob
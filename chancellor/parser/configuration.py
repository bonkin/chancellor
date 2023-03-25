# noinspection SpellCheckingInspection
STARTPOS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'


class Configuration(object):
    """ Parameters that will be used for parsing. """

    def __init__(self,
                 max_threads: int,
                 max_depth: int,
                 min_time: int,
                 min_prob: float,
                 opponent: bool,
                 white_elo: range,
                 black_elo: range,
                 ):
        """ Creates a new configuration.
        :param max_threads: maximum number of threads to use
        :param max_depth: maximum ply depth till which the position is considered
        :param min_time: minimum time till the end of the game at which the position is considered
        :param min_prob: minimum probability of the position to be considered
        :param opponent: whether to consider opponent's moves
        :param white_elo: accepted white Elo range
        :param black_elo: accepted black Elo range
        """
        self._max_threads = max_threads
        self._max_depth = max_depth
        self._min_time = min_time
        self._min_prob = min_prob
        self._opponent = opponent
        self._white_elo = white_elo
        self._black_elo = black_elo

    def get_max_threads(self) -> int:
        """ Returns the maximum number of threads to use. """
        return self._max_threads

    def get_max_depth(self) -> int:
        """ Returns the maximum ply depth till which the position is considered. """
        return self._max_depth

    def get_min_time(self) -> int:
        """ Returns the minimum time till the end of the game at which the position is considered. """
        return self._min_time

    def get_min_prob(self) -> float:
        """ Returns the minimum probability of the position to be considered. """
        return self._min_prob

    def get_opponent(self) -> bool:
        return self._opponent

    def get_white_elo(self) -> range:
        """ Returns accepted white Elo range. """
        return self._white_elo

    def get_black_elo(self) -> range:
        """ Returns accepted black Elo range. """
        return self._black_elo
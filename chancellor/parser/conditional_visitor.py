from typing import Optional

from chess.pgn import GameBuilder, SkipType

from chancellor.parser.configuration import Configuration


class ConditionalVisitor(GameBuilder):
    """ A visitor that only parses games that satisfy rating condition. """

    def __init__(self, config: Configuration):
        super().__init__()
        self._config = config

    def end_headers(self) -> Optional[SkipType]:
        white_elo = self.game.headers.get("WhiteElo", '?')
        black_elo = self.game.headers.get("BlackElo", '?')
        time_control = self.game.headers.get("TimeControl")
        termination = self.game.headers.get("Termination")

        if termination != 'Normal' \
                or white_elo == '?' \
                or black_elo == '?' \
                or int(white_elo) not in self._config.get_white_elo() \
                or int(black_elo) not in self._config.get_black_elo() \
                or time_control is None \
                or not time_control.split('+')[0].isdigit() \
                or int(time_control.split('+')[0]) < self._config.get_min_time():
            return SkipType.SKIP
        else:
            return None

    def begin_variation(self) -> Optional[SkipType]:
        return SkipType.SKIP

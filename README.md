# Chancellor

Chancellor is a chess related project that aims to parse chess games from PGN files and generate an opening repertoire 
based on the most common moves in the games.

## Usage

### Installation

```bash
git@github.com:bonkin/chancellor.git
cd chancellor

virtualenv -p python 3.9 virtualenv_run
ln -s $(pwd)/virtualenv_run/bin/activate $(pwd)/.activate
source .activate
python -m pip install -r requirements.txt

curl https://database.lichess.org/standard/lichess_db_standard_rated_2023-02.pgn.zst -o lichess_db_standard_rated_2023-02.pgn.zst
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pv lichess_db_standard_rated_2023-02.pgn.zst | zstdcat | python chancellor/parser/parser.py
```

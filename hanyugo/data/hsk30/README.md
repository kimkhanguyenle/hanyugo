# HSK 3.0 data pipeline

This folder holds the raw HSK 3.0 vocabulary data and the script that turns it into a seed
SQL file for the `hsk_words` table (see PROJECT_PLAN.md section 6).

## Steps

1. Download `hsk30.csv` from https://github.com/ivankra/hsk30 into this folder.
2. Run `python build_seed.py` — it filters to HSK level 1, normalizes pinyin into toned and
   numbered forms, and writes `seed_hsk1.sql`.
3. Once the D1 database exists (`wrangler d1 create hanyugo-db`), load it with:
   `wrangler d1 execute hanyugo-db --file=./seed_hsk1.sql`

`build_seed.py` is intentionally simple — it's meant to be read and modified as you learn, not
treated as a black box.

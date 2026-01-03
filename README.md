# commander-stats
Magic the Gathering Commander deck analyzer

## MTGJSON data workflow

1) Install tools:
```
npm install
```
2) Fetch datasets (default AtomicCards, use `--dataset all-printings` for full set):
```
npm run fetch:mtgjson [-- --dataset all-printings]
```
3) Trim AtomicCards into a smaller JSON (defaults to all cards, add `--commander-only` to keep only Commander-legal):
```
npm run trim:mtgjson [-- --commander-only]
```
Outputs land in `data/mtgjson/` and are gitignored. Use the trimmed JSON for quicker local analysis.

## Development

```
npm run dev
```

## Validation

```
npm run lint
npm run test:run
npm run typecheck
npm run validate:analysis
```

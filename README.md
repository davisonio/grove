# Grove

Shielded payroll for Zcash. Manages a roster of mainnet shielded recipients, generates ZIP-321 payment URIs, and hands off signing to Zodl.

## How it works

1. Set a passphrase. Grove encrypts your roster client-side with AES-256-GCM.
2. Add recipients (name, mainnet shielded address, amount in USD or ZEC). Or import a CSV.
3. Preview the batch. If you use USD-denominated recipients, Grove fetches the current ZEC/USD rate and converts.
4. Generate the payment URI. Scan the QR with Zodl, or copy the zcash: link.
5. Zodl handles signing and broadcast. Grove never touches private keys.

## Test mode

Toggle test mode to send 0.0001 ZEC to each address first. Verify everything works before running a real batch.

## What Grove does not do

- Store private keys or seed phrases
- Send transactions (that's Zodl's job)
- Accept transparent or testnet payout addresses
- Run a Grove backend. Your roster stays in your browser.
- Send roster data to third parties. USD payouts only fetch a public ZEC/USD price quote.

## Run locally

```
npm install
npm run dev
```

## Run tests

```
npm test
```

## Deploy

```
npm run build
```

Produces a `dist/` folder. Deploy anywhere that serves static files.

## Roadmap

- USDC payouts via Zodl's NEAR intents integration
- Biweekly scheduling with browser notifications
- Multi-vault support (separate rosters for different teams)

## Tech

React, Vite, TypeScript, Tailwind. No backend. Encryption via Web Crypto API.

ZIP-321 spec: https://zips.z.cash/zip-0321

## License

MIT

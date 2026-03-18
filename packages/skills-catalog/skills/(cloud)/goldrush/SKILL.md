---
name: goldrush
description: Blockchain data across 100+ chains via GoldRush API. Use when user says "get wallet balance", "check token prices", "look up transactions", "find NFT holdings", "get DEX pairs", "stream price data", or needs any on-chain data query. Do NOT use for smart contract deployment or transaction signing.
license: MIT
---

# GoldRush Blockchain Data

## Overview

A skill for querying blockchain data across 100+ chains using the GoldRush API. Provides wallet balances, token prices, transaction history, NFT holdings, DEX pairs, and real-time streaming data via a single unified interface.

## When to Use

Use this skill when:

- **Wallet Analysis**: Querying token balances, transaction history, or portfolio value for any address across 100+ chains.
- **Token Pricing**: Getting current or historical token prices, OHLCV candle data, or price comparisons.
- **NFT Data**: Looking up NFT holdings, metadata, collection floor prices, or ownership history.
- **DEX Analytics**: Finding DEX pairs, liquidity pools, swap events, or trading volume.
- **Real-Time Streaming**: Monitoring live price feeds, new DEX pairs, or wallet activity via WebSocket.
- **Cross-Chain Queries**: Any scenario requiring data from multiple blockchains in a single workflow.

## Setup

### Installation

```bash
npx @covalenthq/goldrush-mcp-server
```

### Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "goldrush": {
      "command": "npx",
      "args": ["-y", "@covalenthq/goldrush-mcp-server"],
      "env": {
        "GOLDRUSH_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

Get a free API key at [goldrush.dev](https://goldrush.dev).

## Key Capabilities

### 1. Wallet & Portfolio

- Token balances for any address on any supported chain
- Full transaction history with decoded events
- Portfolio value tracking over time
- Token approvals and allowances

### 2. Pricing & Market Data

- Current token prices in any quote currency
- Historical price lookups
- OHLCV candle data for charting
- Cross-chain price comparisons

### 3. NFT Data

- NFT holdings by wallet
- Collection metadata and floor prices
- Ownership and transfer history

### 4. DEX & DeFi

- DEX pair discovery across supported DEXes
- Liquidity pool data
- Swap and trade event history
- Volume and TVL metrics

### 5. Real-Time Streaming

- Live OHLCV price feeds via WebSocket
- New DEX pair monitoring
- Wallet activity streaming
- Decoded swap and transfer events

## Workflow Patterns

### Pattern A: Wallet Overview

```markdown
1. Query token balances for the address on the target chain.
2. Get recent transactions to understand activity.
3. Check token approvals for security review.
```

### Pattern B: Token Research

```markdown
1. Look up current token price.
2. Get historical OHLCV data for trend analysis.
3. Find DEX pairs to understand liquidity.
```

### Pattern C: Cross-Chain Analysis

```markdown
1. Query balances across multiple chains for one address.
2. Aggregate portfolio value in a single quote currency.
3. Identify the most active chain by transaction count.
```

## Best Practices

- **Chain Selection**: Always specify the chain name (e.g., `eth-mainnet`, `matic-mainnet`) for fastest responses.
- **Pagination**: Use page parameters for large result sets (transactions, events).
- **Caching**: Price data is cached for 5 minutes, balances for 30 seconds. Plan queries accordingly.
- **Rate Limits**: Free tier allows 4 requests/second. Batch queries where possible.

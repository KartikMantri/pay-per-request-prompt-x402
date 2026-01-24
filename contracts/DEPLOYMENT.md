# Contract Deployment Details

## AIAccessMarketplace v3 (with useCredits)

| Field                | Value                                                                |
| -------------------- | -------------------------------------------------------------------- |
| **Contract Address** | `0xf440293fc4bcdb61b25f89ff5e75d55738910fae`                         |
| **Network**          | Monad Testnet (Chain ID: 10143)                                      |
| **Transaction Hash** | `0xc7d87f18c3d650106eac10fb57580223d52319dfe6818cbdd8888ff00ace22dc` |
| **Gas Used**         | 1,467,372                                                            |
| **Owner**            | `0x0c9e972edcae045f043aa8d5edaa42a0311f5bb9`                         |
| **Deployed At**      | 2026-01-17                                                           |

## Explorer Link

https://testnet.monadexplorer.com/address/0xf440293fc4bcdb61b25f89ff5e75d55738910fae

## New Features (v3)

- ✅ `useCredits(address, uint256)` - Consume variable credits (1=text, 3=image, 5=video)
- ✅ `useCredit(address)` - Legacy single credit consumption (still works)
- ✅ `owner` - Immutable owner address (deployer)
- ✅ `withdraw()` - Withdraw all funds to owner
- ✅ `getContractBalance()` - View current contract balance

## Credit Consumption Rates

| Capability | Credits |
| ---------- | ------- |
| Text       | 1       |
| Image      | 3       |
| Video      | 5       |

## Admin Access

- URL: `http://localhost:5174/#admin`
- Only accessible by owner wallet

## Pricing (In Contract)

| Type                     | Amount    |
| ------------------------ | --------- |
| Per Request              | 0.001 MON |
| Premium 7 Days           | 0.01 MON  |
| Premium 30 Days          | 0.03 MON  |
| Credit Pack (10 credits) | 0.008 MON |

---

## Previous Deployments

### v2 (with Withdraw)

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| Contract Address | `0x7acc1dbbeb1d5057a4a0910ba3b29b4e80eeb8b3` |
| Status           | ⚠️ Deprecated - single credit only           |

### v1 (No Withdraw)

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| Contract Address | `0xd240a178267909bde96256fb9bab36199d324c44` |
| Status           | ⚠️ Deprecated - cannot withdraw funds        |

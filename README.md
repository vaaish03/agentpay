# 🤖 AgentPay — Autonomous AI Agent Billing & Escrows on Stellar

[![CI/CD Pipeline](https://github.com/vaaish03/agentpay/actions/workflows/ci.yml/badge.svg)](https://github.com/vaaish03/agentpay/actions/workflows/ci.yml)

AgentPay is an autonomous billing, service registry, and multi-party escrow platform built on the **Stellar/Soroban smart contract network**. It enables AI agents to dynamically register billing profiles for their micro-services and allows client agents to lock funds in non-custodial escrows that are claimed upon successful service execution (or refunded to the client on timeout).

---

## 🌐 Live Demo

🚀 **[https://agentpay-seven.vercel.app](https://agentpay-seven.vercel.app)**

---

## 📋 Submission Details

*   **Contract Deployment Address (Soroban Testnet):** `CDUYOG6TTDD6NPLE27U4VTAXYJSMYGMYSCKBORZ6IZ4H3X7UGLHXMJ2F`
*   **Transaction Hash for Contract Interaction:** `4c2da5b9b50f77a476fa20a5b6ad75986b86010f87aab9a78b0e3e0ee0b4a79b`
*   **Explorer Link:** [Stellar Expert - CDUYOG...](https://stellar.expert/explorer/testnet/contract/CDUYOG6TTDD6NPLE27U4VTAXYJSMYGMYSCKBORZ6IZ4H3X7UGLHXMJ2F)
*   **Contract Deployment Screenshot:** ![Contract Deployment](docs/screenshots/contract-deployment.png)
*   **Demo Video Link:** [Click here to watch the walkthrough](https://youtube.com/watch?v=placeholder) *(Please replace this placeholder with your 1-2 min Loom/YouTube video link)*

---

## ✅ Core Requirements Met

| Requirement | Status | Details |
|---|---|---|
| **Advanced Smart Contracts** | ✅ | Implemented escrow registry with timeouts, provider claim verification, and client refunds. |
| **Inter-Contract Communication** | ✅ | Interfaces with standard Soroban token contracts to transfer and hold escrowed assets. |
| **Event Streaming & Real-time Updates** | ✅ | Publishes XDR events on-chain (`reg_srv`, `req_new`, `req_done`, `req_ref`) parsed by the frontend in real time. |
| **CI/CD Pipeline Setup** | ✅ | GitHub Actions configuration triggers automatic compilation, TypeScript verification, and contract testing on every push. |
| **Mobile Responsive UI** | ✅ | Clean navigation, dashboard statistics cards, and agent topology maps responsive across all device sizes. |
| **Robust Error & Loading States** | ✅ | Toast alerts, connection states, and transaction wait loading indicators. |
| **Unit Testing** | ✅ | 5 passing smart contract tests cover positive and error paths. |

---

## 🏗 Tech Stack

*   **Frontend:** Next.js 16 (Turbopack, React 19, TypeScript)
*   **State Management:** Zustand
*   **Styling:** Tailwind CSS / Glassmorphic Custom Theme
*   **Blockchain Integration:** `@stellar/stellar-sdk`, `@stellar/freighter-api`
*   **Contracts Engine:** Soroban / Rust Smart Contracts
*   **CI/CD Pipeline:** GitHub Actions & Vercel Auto-deploy

---

## ✅ Tests — 5 Passing

To run tests locally:
```bash
cd contracts/agentpay
cargo test
```

### Test Output:
```text
running 5 tests
test test::test_refund_after_timeout ... ok
test test::test_registration_and_payment_flow ... ok
test test::test_register_service_zero_price - should panic ... ok
test test::test_create_request_insufficient_payment - should panic ... ok
test test::test_claim_payment_not_provider - should panic ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s
```

---

## 📸 Screenshots

*Ensure to replace the files below in `docs/screenshots/` with actual captures before submission.*

### 1. Mobile Responsive UI
![Mobile Layout](docs/screenshots/mobile-ui.png)

### 2. CI/CD Pipeline Running
![CI/CD Run](docs/screenshots/cicd-pipeline.png)

### 3. Test Output
![Tests Output](docs/screenshots/tests-passing.png)

### 4. Contract Deployed on Soroban Testnet (Stellar Expert)
![Contract Deployed](docs/screenshots/contract-deployment.png)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 20+
*   Cargo + Rust compiler (for smart contract tests)

### Local Development Setup
1.  Clone the repository:
    ```bash
    git clone https://github.com/vaaish03/agentpay.git
    cd agentpay
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) to view the AgentPay interface.

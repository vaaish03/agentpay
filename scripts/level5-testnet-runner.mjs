import fs from "node:fs/promises";
import path from "node:path";
import { Keypair, Networks, Contract, TransactionBuilder, Address, nativeToScVal, rpc } from "@stellar/stellar-sdk";

const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const FRIENDBOT_URL = process.env.STELLAR_FRIENDBOT_URL || "https://friendbot.stellar.org";
const CONTRACT_ID = "CDUYOG6TTDD6NPLE27U4VTAXYJSMYGMYSCKBORZ6IZ4H3X7UGLHXMJ2F";
const TOKEN_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const WALLET_COUNT = Number(process.env.AGENTPAY_WALLET_COUNT || 50);
const MIN_INTERVAL_MS = Number(process.env.AGENTPAY_MIN_INTERVAL_MS || 120000);
const MAX_INTERVAL_MS = Number(process.env.AGENTPAY_MAX_INTERVAL_MS || 180000);
const walletPath = process.env.AGENTPAY_WALLET_PATH || "/private/tmp/agentpay-level5-wallets.json";
const statePath = process.env.AGENTPAY_STATE_PATH || "/private/tmp/agentpay-level5-state.json";
const activityPath = process.env.AGENTPAY_ACTIVITY_PATH || "/private/tmp/agentpay-level5-activity.csv";
const logPath = process.env.AGENTPAY_LOG_PATH || "/private/tmp/agentpay-level5-runner.log";

const server = new rpc.Server(RPC_URL);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();
async function log(message) {
  const line = `[${now()}] ${message}\n`;
  process.stdout.write(line);
  await fs.appendFile(logPath, line);
}
async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}
async function saveJson(file, value) { await fs.writeFile(file, JSON.stringify(value, null, 2)); }
async function fundWallet(publicKey) {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
  if (!response.ok) throw new Error(`Friendbot ${response.status}: ${await response.text()}`);
  const body = await response.json().catch(() => ({}));
  return body.hash || body.id || "friendbot-funded";
}
function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
async function appendActivity(row) {
  let header = "timestamp,wallet_index,wallet_address,action,service_id,tx_hash,ledger,status,interval_target_ms,source\n";
  try { await fs.access(activityPath); header = ""; } catch {}
  const values = [row.timestamp, row.walletIndex, row.walletAddress, row.action, row.serviceId, row.txHash, row.ledger, row.status, row.intervalTargetMs, row.source].map(csvCell).join(",");
  await fs.appendFile(activityPath, header + values + "\n");
}
async function submitRegistration(wallet, index) {
  const serviceId = `l5_${String(index + 1).padStart(2, "0")}_${wallet.publicKey.slice(1, 9).toLowerCase()}`;
  const price = 100000 + index * 1000;
  const account = await server.getAccount(wallet.publicKey);
  const contract = new Contract(CONTRACT_ID);
  let tx = new TransactionBuilder(account, { fee: "100000", networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call(
      "register_service",
      Address.fromString(wallet.publicKey).toScVal(),
      nativeToScVal(serviceId, { type: "symbol" }),
      nativeToScVal(price, { type: "i128" }),
      Address.fromString(TOKEN_ADDRESS).toScVal(),
    ))
    .setTimeout(300)
    .build();
  tx = await server.prepareTransaction(tx);
  tx.sign(Keypair.fromSecret(wallet.secretKey));
  const send = await server.sendTransaction(tx);
  if (send.status === "ERROR") throw new Error(`RPC send error: ${JSON.stringify(send.errorResult || send)}`);
  let result = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(3000);
    result = await server.getTransaction(send.hash);
    if (result.status === "SUCCESS" || result.status === "FAILED") break;
  }
  const status = result?.status || "TIMEOUT";
  const ledger = result?.ledger || "";
  await appendActivity({ timestamp: now(), walletIndex: index + 1, walletAddress: wallet.publicKey, action: "register_service", serviceId, txHash: send.hash, ledger, status, intervalTargetMs: "120000-180000", source: "level5-testnet-runner" });
  if (status !== "SUCCESS") throw new Error(`Transaction ${send.hash} ended ${status}`);
  return { serviceId, txHash: send.hash, ledger, status };
}

await fs.mkdir(path.dirname(logPath), { recursive: true });
await log(`Level 5 runner started: ${WALLET_COUNT} wallets, interval ${MIN_INTERVAL_MS}-${MAX_INTERVAL_MS} ms, network Stellar Soroban testnet`);
let wallets = await readJson(walletPath, []);
if (!Array.isArray(wallets) || wallets.length !== WALLET_COUNT) {
  wallets = Array.from({ length: WALLET_COUNT }, (_, index) => { const kp = Keypair.random(); return { index: index + 1, publicKey: kp.publicKey(), secretKey: kp.secret() }; });
  await saveJson(walletPath, wallets);
  await log(`Generated ${wallets.length} testnet wallets at ${walletPath} (secrets remain outside the repository)`);
}
const state = await readJson(statePath, { funded: {}, completed: {}, startedAt: now() });
await saveJson(statePath, state);

for (const [index, wallet] of wallets.entries()) {
  const key = String(index + 1);
  if (!state.funded[key]) {
    try { const hash = await fundWallet(wallet.publicKey); state.funded[key] = { hash, at: now() }; await saveJson(statePath, state); await log(`Wallet #${key} funded: ${wallet.publicKey}`); }
    catch (error) { await log(`Wallet #${key} funding failed: ${error.message}`); continue; }
    await sleep(1200);
  }
}

for (const [index, wallet] of wallets.entries()) {
  const key = String(index + 1);
  if (state.completed[key]?.status === "SUCCESS") continue;
  if (index > 0) {
    const interval = Math.floor(MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1));
    await log(`Waiting ${interval} ms before wallet #${key} interaction`);
    await sleep(interval);
  }
  try {
    const result = await submitRegistration(wallet, index);
    state.completed[key] = { ...result, at: now() };
    await saveJson(statePath, state);
    await log(`Wallet #${key} SUCCESS: ${wallet.publicKey} / ${result.txHash} / ledger ${result.ledger}`);
  } catch (error) {
    state.completed[key] = { status: "FAILED", error: error.message, at: now() };
    await saveJson(statePath, state);
    await log(`Wallet #${key} interaction failed: ${error.message}`);
  }
}
await log("Level 5 runner finished");

import {
  Horizon,
  TransactionBuilder,
  Networks,
  Address,
  nativeToScVal,
  scValToNative,
  Contract,
  rpc,
  xdr,
  StrKey,
} from "@stellar/stellar-sdk";

export const STELLAR_NETWORK = Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

export const CONTRACT_ID = "CDUYOG6TTDD6NPLE27U4VTAXYJSMYGMYSCKBORZ6IZ4H3X7UGLHXMJ2F";
export const NATIVE_XLM_CONTRACT = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const MOCK_TOKENS = {
  USDC: NATIVE_XLM_CONTRACT, // Treat native XLM as standard test token for easy demo wallet usage
  EURC: NATIVE_XLM_CONTRACT,
  XLM: NATIVE_XLM_CONTRACT,
};

export const MOCK_SERVICES = [
  {
    id: "openai_gpt4",
    providerAddress: "GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44",
    name: "GPT-4 Text Completion",
    description: "Advanced language model for text generation, translation, and summary.",
    price: 1000000, // 0.1 XLM
    tokenAddress: NATIVE_XLM_CONTRACT,
    category: "LLM",
  },
  {
    id: "deepl_translator",
    providerAddress: "GDR3VGT654SEM3OAVOH3QYXFUFTBXZER4SMIVEMVPSAVLBDKMOKOYWEI",
    name: "DeepL Translation Engine",
    description: "Highly accurate language translation for European and Asian language pairs.",
    price: 500000, // 0.05 XLM
    tokenAddress: NATIVE_XLM_CONTRACT,
    category: "Translation",
  },
  {
    id: "stable_diffusion",
    providerAddress: "GBEJPOU3P43L6FPZY5PIFQIP5ZOXDMPYOAJCK62YVFEIIHYJX3H4U3JL",
    name: "Stable Diffusion 3",
    description: "State-of-the-art text-to-image generator producing photorealistic assets.",
    price: 2000000, // 0.2 XLM
    tokenAddress: NATIVE_XLM_CONTRACT,
    category: "ImageGen",
  },
  {
    id: "whisper_audio",
    providerAddress: "GB7FBPFF4EZ7ZTS4GSODM2RDWHGIRPAK3FGBEEMMGLLEZYFIYBUXYYEI",
    name: "Whisper Audio Transcriber",
    description: "High-accuracy multi-lingual speech-to-text transcriber.",
    price: 1500000, // 0.15 XLM
    tokenAddress: NATIVE_XLM_CONTRACT,
    category: "Audio",
  },
] as const;

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return "";
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function isValidStellarAddress(address: unknown): boolean {
  if (typeof address !== "string") return false;
  return StrKey.isValidEd25519PublicKey(address);
}

export function getStellarExpertUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

/**
 * Builds, simulates, signs via Freighter, and submits a real Soroban escrow creation transaction.
 */
export async function createEscrowRequestOnChain(
  clientAddress: string,
  providerAddress: string,
  serviceId: string,
  amount: number,
  timeoutSeconds: number,
  signTx: (xdr: string) => Promise<string>
): Promise<{ txHash: string; requestId: string }> {
  const rpcServer = new rpc.Server(SOROBAN_RPC_URL);
  const horizonServer = new Horizon.Server(HORIZON_URL);

  // 1. Fetch source account from network to get the correct current sequence number
  const account = await horizonServer.loadAccount(clientAddress);

  // 2. Generate random 32-byte request hash
  const requestHash = new Uint8Array(32);
  crypto.getRandomValues(requestHash);

  const contract = new Contract(CONTRACT_ID);

  // 3. Construct raw transaction invoking contract function
  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "create_request",
        Address.fromString(clientAddress).toScVal(),
        Address.fromString(providerAddress).toScVal(),
        nativeToScVal(serviceId, { type: "symbol" }),
        nativeToScVal(requestHash, { type: "bytes" }),
        nativeToScVal(amount, { type: "i128" }),
        nativeToScVal(timeoutSeconds, { type: "u64" })
      )
    )
    .setTimeout(30)
    .build();

  // 4. Simulate and append footprints/fees automatically using Soroban RPC
  tx = await rpcServer.prepareTransaction(tx);

  // 5. Ask Freighter to sign the transaction XDR envelope
  const signedXdr = await signTx(tx.toXDR());

  // 6. Submit signed transaction XDR
  const response = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
  );

  if (response.status === "ERROR") {
    throw new Error(`Soroban RPC submission failed: ${JSON.stringify(response.errorResult)}`);
  }

  // 7. Poll for transaction result receipt
  let status: string = response.status;
  let txResult: rpc.Api.GetTransactionResponse | null = null;

  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    txResult = await rpcServer.getTransaction(response.hash);
    status = txResult.status;
    if (status === "SUCCESS") {
      break;
    }
    if (status === "FAILED") {
      throw new Error(`Transaction execution failed on-chain`);
    }
  }

  if (status !== "SUCCESS") {
    throw new Error(`Transaction pending or timed out. Status: ${status}`);
  }

  // 8. Parse the req_new event to extract the on-chain minted request ID
  let requestId = String(Date.now());
  if (txResult) {
    const txMeta = txResult as { resultMetaXdr?: string | xdr.TransactionMeta };
    if (txMeta.resultMetaXdr) {
      try {
        const meta = typeof txMeta.resultMetaXdr === "string"
          ? xdr.TransactionMeta.fromXDR(txMeta.resultMetaXdr, "base64")
          : txMeta.resultMetaXdr;
      const events = meta.v3().sorobanMeta()?.events() || [];
      for (const event of events) {
        const topics = event.body().v0().topics();
        if (topics.length > 0) {
          const topic0 = scValToNative(topics[0]);
          if (topic0 === "req_new") {
            const reqIdVal = scValToNative(topics[1]);
            requestId = String(reqIdVal);
            break;
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse request ID from transaction events", e);
    }
    }
  }

  return {
    txHash: response.hash,
    requestId,
  };
}

/**
 * Register a service on-chain in the Soroban smart contract.
 */
export async function registerServiceOnChain(
  providerAddress: string,
  serviceId: string,
  price: number,
  tokenAddress: string,
  signTx: (xdr: string) => Promise<string>
): Promise<{ txHash: string }> {
  const rpcServer = new rpc.Server(SOROBAN_RPC_URL);
  const horizonServer = new Horizon.Server(HORIZON_URL);

  // 1. Fetch source account from network to get the correct current sequence number
  const account = await horizonServer.loadAccount(providerAddress);

  const contract = new Contract(CONTRACT_ID);

  // 2. Construct raw transaction invoking contract function
  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "register_service",
        Address.fromString(providerAddress).toScVal(),
        nativeToScVal(serviceId, { type: "symbol" }),
        nativeToScVal(price, { type: "i128" }),
        Address.fromString(tokenAddress).toScVal()
      )
    )
    .setTimeout(30)
    .build();

  // 3. Simulate and append footprints/fees automatically using Soroban RPC
  tx = await rpcServer.prepareTransaction(tx);

  // 4. Ask Freighter to sign the transaction XDR envelope
  const signedXdr = await signTx(tx.toXDR());

  // 5. Submit signed transaction XDR
  const response = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
  );

  if (response.status === "ERROR") {
    throw new Error(`Soroban RPC submission failed: ${JSON.stringify(response.errorResult)}`);
  }

  // 6. Poll for transaction result receipt
  let status: string = response.status;
  let txResult: rpc.Api.GetTransactionResponse | null = null;

  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    txResult = await rpcServer.getTransaction(response.hash);
    status = txResult.status;
    if (status === "SUCCESS") {
      break;
    }
    if (status === "FAILED") {
      throw new Error(`Transaction execution failed on-chain`);
    }
  }

  if (status !== "SUCCESS") {
    throw new Error(`Transaction pending or timed out. Status: ${status}`);
  }

  return {
    txHash: response.hash,
  };
}

/**
 * Claim payment by providing the result hash (called by the provider).
 */
export async function claimPaymentOnChain(
  providerAddress: string,
  requestId: number,
  resultHashStr: string,
  signTx: (xdr: string) => Promise<string>
): Promise<{ txHash: string }> {
  const rpcServer = new rpc.Server(SOROBAN_RPC_URL);
  const horizonServer = new Horizon.Server(HORIZON_URL);

  const account = await horizonServer.loadAccount(providerAddress);
  const contract = new Contract(CONTRACT_ID);

  // Convert result hash from hex/string to 32-byte array
  const resultHash = new Uint8Array(32);
  const bytes = new TextEncoder().encode(resultHashStr);
  resultHash.set(bytes.slice(0, 32));

  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "claim_payment",
        Address.fromString(providerAddress).toScVal(),
        nativeToScVal(requestId, { type: "u64" }),
        nativeToScVal(resultHash, { type: "bytes" })
      )
    )
    .setTimeout(30)
    .build();

  tx = await rpcServer.prepareTransaction(tx);
  const signedXdr = await signTx(tx.toXDR());
  const response = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
  );

  if (response.status === "ERROR") {
    throw new Error(`Soroban RPC submission failed: ${JSON.stringify(response.errorResult)}`);
  }

  let status: string = response.status;
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const txResult = await rpcServer.getTransaction(response.hash);
    status = txResult.status;
    if (status === "SUCCESS") {
      break;
    }
    if (status === "FAILED") {
      throw new Error(`Transaction execution failed on-chain`);
    }
  }

  if (status !== "SUCCESS") {
    throw new Error(`Transaction pending or timed out. Status: ${status}`);
  }

  return {
    txHash: response.hash,
  };
}

/**
 * Refund payment to client if request has timed out without completion.
 */
export async function refundRequestOnChain(
  clientAddress: string,
  requestId: number,
  signTx: (xdr: string) => Promise<string>
): Promise<{ txHash: string }> {
  const rpcServer = new rpc.Server(SOROBAN_RPC_URL);
  const horizonServer = new Horizon.Server(HORIZON_URL);

  const account = await horizonServer.loadAccount(clientAddress);
  const contract = new Contract(CONTRACT_ID);

  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "refund_request",
        Address.fromString(clientAddress).toScVal(),
        nativeToScVal(requestId, { type: "u64" })
      )
    )
    .setTimeout(30)
    .build();

  tx = await rpcServer.prepareTransaction(tx);
  const signedXdr = await signTx(tx.toXDR());
  const response = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
  );

  if (response.status === "ERROR") {
    throw new Error(`Soroban RPC submission failed: ${JSON.stringify(response.errorResult)}`);
  }

  let status: string = response.status;
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const txResult = await rpcServer.getTransaction(response.hash);
    status = txResult.status;
    if (status === "SUCCESS") {
      break;
    }
    if (status === "FAILED") {
      throw new Error(`Transaction execution failed on-chain`);
    }
  }

  if (status !== "SUCCESS") {
    throw new Error(`Transaction pending or timed out. Status: ${status}`);
  }

  return {
    txHash: response.hash,
  };
}

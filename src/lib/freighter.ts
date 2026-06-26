import {
  isConnected as checkConnected,
  getAddress as checkAddress,
  signTransaction as signTx,
  getNetwork as checkNetwork,
  setAllowed,
  isAllowed,
} from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";
import type { WalletState } from "@/types";

export async function checkFreighterConnected(): Promise<boolean> {
  try {
    const res = await checkConnected();
    return !!res.isConnected;
  } catch {
    return false;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const allowedRes = await isAllowed();
    if (!allowedRes.isAllowed) {
      const setRes = await setAllowed();
      if (!setRes.isAllowed) return null;
    }
    const res = await checkAddress();
    return res.address || null;
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<WalletState> {
  try {
    const allowedRes = await isAllowed();
    if (!allowedRes.isAllowed) {
      const setRes = await setAllowed();
      if (!setRes.isAllowed) {
        throw new Error("Access denied by user");
      }
    }

    const addrRes = await checkAddress();
    if (addrRes.error) {
      throw new Error(addrRes.error);
    }
    
    const netRes = await checkNetwork();

    return {
      address: addrRes.address || null,
      isConnected: !!addrRes.address,
      network: netRes.network || "TESTNET",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Freighter connection failed";
    console.error(msg);
    throw new Error(msg);
  }
}

export async function signTransaction(
  xdrString: string,
  network: string = "TESTNET"
): Promise<string> {
  try {
    const networkPassphrase =
      network === "TESTNET"
        ? Networks.TESTNET
        : Networks.PUBLIC;
    
    const res = await signTx(xdrString, {
      networkPassphrase,
    });

    if (res.error) {
      throw new Error(res.error);
    }

    return res.signedTxXdr;
  } catch (err) {
    console.error("Freighter transaction signing failed", err);
    throw err;
  }
}

import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

const RC_IOS_API_KEY = "appl_qEyiFLlgqTdoUtQrYJtoCXMWvDJ";
export const ENTITLEMENT_ID = "pro";
export const MONTHLY_PRODUCT_ID = "mednote.monthly";
export const YEARLY_PRODUCT_ID = "mednote.yearly";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initializeRevenueCat(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) {
    await Purchases.logIn({ appUserID: userId });
    return;
  }
  if (initPromise) {
    await initPromise;
    await Purchases.logIn({ appUserID: userId });
    return;
  }
  initPromise = (async () => {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey: RC_IOS_API_KEY, appUserID: userId });
    initialized = true;
  })();
  await initPromise;
}

export function isInitialized(): boolean {
  return initialized;
}

export async function waitForInit(timeoutMs = 8000): Promise<void> {
  if (initialized) return;
  if (initPromise) {
    await Promise.race([
      initPromise,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("RC init timeout")), timeoutMs)),
    ]);
    return;
  }
  // Not yet started — poll briefly
  const start = Date.now();
  while (!initialized && Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 300));
  }
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { offerings } = await Purchases.getOfferings();
    console.log("[RC] current offering:", JSON.stringify(offerings.current));
    return offerings.current;
  } catch (e) {
    console.error("[RC] getOfferings error:", e);
    return null;
  }
}

/** Direct StoreKit product fetch — fallback when offerings return no packages */
export async function getProducts(): Promise<any[]> {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [MONTHLY_PRODUCT_ID, YEARLY_PRODUCT_ID],
    });
    console.log("[RC] direct products:", JSON.stringify(products));
    return products ?? [];
  } catch (e) {
    console.error("[RC] getProducts error:", e);
    return [];
  }
}

function isCancellation(e: any): boolean {
  return (
    e?.code === "1" ||
    e?.code === "PURCHASE_CANCELLED" ||
    e?.userCancelled === true ||
    e?.message?.toLowerCase().includes("cancel") ||
    e?.message?.toLowerCase().includes("dismissed") ||
    e?.underlyingErrorMessage?.toLowerCase().includes("cancel")
  );
}

export async function purchasePackage(rcPackage: any): Promise<{ success: boolean; customerInfo?: any; cancelled?: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    return { success: true, customerInfo };
  } catch (e: any) {
    if (isCancellation(e)) return { success: false, cancelled: true };
    throw e;
  }
}

/** Purchase a raw StoreProduct directly (fallback when no offering package) */
export async function purchaseProduct(storeProduct: any): Promise<{ success: boolean; customerInfo?: any; cancelled?: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct({ product: storeProduct });
    return { success: true, customerInfo };
  } catch (e: any) {
    if (isCancellation(e)) return { success: false, cancelled: true };
    throw e;
  }
}

export async function restorePurchases(): Promise<any> {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo(): Promise<any> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (e) {
    console.error("[RC] getCustomerInfo error:", e);
    return null;
  }
}

export function hasProEntitlement(customerInfo: any): boolean {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

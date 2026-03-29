import { Capacitor } from "@capacitor/core";

let cachedDeviceId: string | null = null;
let cachedDeviceName: string | null = null;

export function overrideStoredDeviceId(id: string): void {
  cachedDeviceId = id;
  localStorage.setItem("mednote_device_id", id);
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Device } = await import("@capacitor/device");
      const info = await Device.getId();
      cachedDeviceId = info.identifier;
      return cachedDeviceId;
    } catch (e) {
      console.warn("[device] Failed to get native device ID, falling back to stored UUID", e);
    }
  }

  let stored = localStorage.getItem("mednote_device_id");
  if (!stored) {
    stored = generateUUID();
    localStorage.setItem("mednote_device_id", stored);
  }
  cachedDeviceId = stored;
  return cachedDeviceId;
}

export async function getDeviceName(): Promise<string> {
  if (cachedDeviceName) return cachedDeviceName;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Device } = await import("@capacitor/device");
      const info = await Device.getInfo();
      cachedDeviceName = `${info.manufacturer ?? ""} ${info.model ?? ""}`.trim() || "iPhone";
      return cachedDeviceName;
    } catch (e) {
      console.warn("[device] Failed to get native device name", e);
    }
  }

  cachedDeviceName = "Web Browser";
  return cachedDeviceName;
}

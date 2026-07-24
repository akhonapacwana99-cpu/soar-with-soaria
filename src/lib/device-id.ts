// Browser-generated device id used to scope all app data since sign-in is off.
const KEY = "careerpilot:device-id:v1";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

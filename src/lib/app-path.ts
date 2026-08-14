const configuredBasePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/filex" : "");

export const APP_BASE_PATH = configuredBasePath.replace(/\/$/, "");

export function appPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalizedPath}` || "/";
}

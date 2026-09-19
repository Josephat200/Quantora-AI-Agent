const booleanFromEnv = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : value.toLowerCase() === "true";

export const settings = {
  appName: process.env.APP_NAME ?? "Quantora AI",
  appVersion: process.env.APP_VERSION ?? "1.0.0",
  environment: process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
  debug: booleanFromEnv(process.env.DEBUG, true),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET_KEY ?? "change-this-in-development",
  jwtAlgorithm: "HS256",
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES ?? 60),
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "",
  aiBaseUrl: process.env.AI_BASE_URL ?? "",
  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * 1024 * 1024,
};
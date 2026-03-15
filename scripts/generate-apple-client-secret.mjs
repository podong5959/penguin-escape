#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MAX_EXPIRY_SECONDS = 60 * 60 * 24 * 180;

function printHelp() {
  console.log(`Generate an Apple Sign in with Apple client secret (JWT).

Usage:
  node ./scripts/generate-apple-client-secret.mjs \\
    --team-id YN8CKN8TY6 \\
    --key-id X8B233W3G3 \\
    --client-id com.example.app.web \\
    --private-key /path/to/AuthKey_X8B233W3G3.p8

Options:
  --team-id       Apple Developer Team ID
  --key-id        Apple Sign in with Apple Key ID
  --client-id     Apple Services ID identifier
  --private-key   Path to the .p8 private key file
  --expires-in    Secret lifetime in seconds (default/max: 15552000)
  --help          Show this help message
`);
}

function readArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createJwt({ teamId, keyId, clientId, privateKeyPem, expiresIn }) {
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = Math.min(Math.max(1, Number(expiresIn) || MAX_EXPIRY_SECONDS), MAX_EXPIRY_SECONDS);
  const header = {
    alg: "ES256",
    kid: keyId,
    typ: "JWT",
  };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + expirySeconds,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKeyPem,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function main() {
  const args = readArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const teamId = String(args["team-id"] || "").trim();
  const keyId = String(args["key-id"] || "").trim();
  const clientId = String(args["client-id"] || "").trim();
  const privateKeyPath = String(args["private-key"] || "").trim();
  const expiresIn = String(args["expires-in"] || MAX_EXPIRY_SECONDS).trim();

  if (!teamId || !keyId || !clientId || !privateKeyPath) {
    printHelp();
    throw new Error("team-id, key-id, client-id, and private-key are required");
  }

  const resolvedKeyPath = path.resolve(privateKeyPath);
  if (!fs.existsSync(resolvedKeyPath)) {
    throw new Error(`Private key file not found: ${resolvedKeyPath}`);
  }

  const privateKeyPem = fs.readFileSync(resolvedKeyPath, "utf8");
  const jwt = createJwt({
    teamId,
    keyId,
    clientId,
    privateKeyPem,
    expiresIn,
  });

  console.log(jwt);
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}

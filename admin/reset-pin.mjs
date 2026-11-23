#!/usr/bin/env node
// reset-pin.mjs — set a new 6-digit PIN for one KidsChinese account.
// Adapted from the same tool in the Kids Games repo.
//
// Runs on Sean's computer only. It uses the Firebase Admin SDK and a service
// account key. The key gives full control of the Firebase project, so:
//   - keep the key OUTSIDE this repo folder (the repo is public);
//   - never commit it; this script stops if the key is inside the repo.
//
// Usage (in the admin/ folder, after "npm install"):
//   node reset-pin.mjs                     list the players, pick one, type the new PIN
//   node reset-pin.mjs --player JY         go straight to account JY
//   node reset-pin.mjs --list              list the players only, change nothing
//   node reset-pin.mjs --key <path>        use this key file
//
// Key file: --key <path>, else the GOOGLE_APPLICATION_CREDENTIALS environment
// variable, else <home folder>/kidschinese-admin/service-account.json.
// The project ID comes from js/firebase/config.js; the key must be for that project.
//
// The PIN is typed at a hidden prompt. It is not stored, logged, or put on the
// command line.

import { readFileSync, existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { FIREBASE_CONFIG } from "../js/firebase/config.js";
import { ACCOUNTS, EMAIL_DOMAIN, accountForEmail } from "../js/accounts.js";

const PROJECT_ID = FIREBASE_CONFIG ? FIREBASE_CONFIG.projectId : null;
const PIN_PATTERN = /^\d{6}$/;
const DEFAULT_KEY = path.join(homedir(), "kidschinese-admin", "service-account.json");
const ORDER = ACCOUNTS.map((a) => a.code); // same order as the sign-in page
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---------- small helpers ---------- */

function fail(message) {
  console.error("\nStopped: " + message);
  process.exit(1);
}

function readArgs(argv) {
  const args = { list: false, player: null, key: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a === "--player") args.player = argv[++i];
    else if (a === "--key") args.key = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log("Usage: node reset-pin.mjs [--list] [--player CODE] [--key <path>]");
      process.exit(0);
    } else fail(`unknown option "${a}". Use --help.`);
  }
  return args;
}

// A normal question. A new readline each time, so it does not fight with the hidden prompt.
async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(question)).trim(); }
  finally { rl.close(); }
}

// A hidden question: shows * for each character. Needs a real terminal window.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) fail("run this script in a terminal window (the PIN prompt needs one).");
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    let value = "";
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n") { cleanup(); process.stdout.write("\n"); resolve(value); return; }
        if (c === "\u0003") { cleanup(); process.stdout.write("\nCancelled. Nothing changed.\n"); process.exit(130); }
        if (c === "\u007f" || c === "\b") {
          if (value) { value = value.slice(0, -1); process.stdout.write("\b \b"); }
          continue;
        }
        if (c >= " ") { value += c; process.stdout.write("*"); }
      }
    };
    stdin.on("data", onData);
  });
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/* ---------- 1. the key ---------- */

function loadKey(argKey) {
  const keyPath = path.resolve(argKey || process.env.GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_KEY);
  if (!existsSync(keyPath)) {
    fail(`no key file at\n  ${keyPath}\n` +
      "Download a key: Firebase console > Project settings > Service accounts >\n" +
      "Generate new private key. Save it at the path above, or give --key <path>.");
  }
  if (isInside(realpathSync(keyPath), realpathSync(REPO_ROOT))) {
    fail(`the key file is inside the repo folder:\n  ${keyPath}\n` +
      "Move it out of the repo (the repo is public), then run again.");
  }
  let key;
  try { key = JSON.parse(readFileSync(keyPath, "utf8")); }
  catch { fail(`the key file is not valid JSON:\n  ${keyPath}`); }
  if (key.type !== "service_account") fail("the key file is not a service account key.");
  if (key.project_id !== PROJECT_ID) {
    fail(`the key is for project "${key.project_id}", not "${PROJECT_ID}".`);
  }
  return key;
}

/* ---------- 2. the accounts ---------- */

// All @kidschinese.invalid accounts, with the code from the email (js/accounts.js).
async function loadPlayers(auth) {
  const players = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      if (!u.email || !u.email.endsWith(EMAIL_DOMAIN)) continue;
      players.push({
        uid: u.uid,
        email: u.email,
        code: accountForEmail(u.email)?.code || null,
        disabled: u.disabled,
        lastSignIn: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toLocaleString() : "never",
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  const rank = (p) => (ORDER.includes(p.code) ? ORDER.indexOf(p.code) : ORDER.length);
  players.sort((a, b) => rank(a) - rank(b) || a.email.localeCompare(b.email));
  return players;
}

function showPlayers(players) {
  console.log("\nKidsChinese accounts (project " + PROJECT_ID + "):\n");
  players.forEach((p, i) => {
    const code = p.code || "(not in accounts.js)";
    const flags = p.disabled ? "  [DISABLED]" : "";
    console.log(`  ${String(i + 1).padStart(2)}. ${code.padEnd(20)} ${p.email.padEnd(28)} last sign-in: ${p.lastSignIn}${flags}`);
  });
  console.log("");
}

function findPlayer(players, answer) {
  const a = String(answer || "").trim();
  if (!a) return null;
  if (/^\d+$/.test(a)) return players[Number(a) - 1] || null;
  const lower = a.toLowerCase();
  return players.find((p) => (p.code && p.code.toLowerCase() === lower)
    || p.email.toLowerCase() === lower
    || p.email.toLowerCase() === lower + EMAIL_DOMAIN) || null;
}

/* ---------- 3. the new PIN ---------- */

async function askNewPin() {
  for (let tries = 0; tries < 3; tries++) {
    const pin = await askHidden("New 6-digit PIN: ");
    if (!PIN_PATTERN.test(pin)) { console.log("  The PIN must be exactly 6 digits. Try again."); continue; }
    const again = await askHidden("Type the PIN again: ");
    if (again !== pin) { console.log("  The two PINs are not the same. Try again."); continue; }
    return pin;
  }
  fail("no valid PIN after 3 tries. Nothing changed.");
}

/* ---------- main ---------- */

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (!PROJECT_ID) fail("js/firebase/config.js has no Firebase config yet. Finish firebase/SETUP.md first.");
  const key = loadKey(args.key);

  initializeApp({ credential: cert(key), projectId: PROJECT_ID });
  const auth = getAuth();

  let players;
  try { players = await loadPlayers(auth); }
  catch (e) { fail(`could not read the accounts from Firebase (${e.code || e.message}).`); }
  if (!players.length) fail(`no accounts that end with ${EMAIL_DOMAIN}.`);

  showPlayers(players);
  if (args.list) return;

  const player = findPlayer(players, args.player ?? await ask("Account (number or code, for example JY): "));
  if (!player) fail("no such account. Nothing changed.");
  if (!player.code) {
    console.log(`Note: ${player.email} is not in js/accounts.js, so it cannot use the app.`);
  }
  console.log(`\nSelected: ${player.code || "(no code)"}  ${player.email}  uid ${player.uid}\n`);

  const pin = await askNewPin();

  const yes = await ask(`Set this new PIN for ${player.code || player.email}? Type yes to go on: `);
  if (yes.toLowerCase() !== "yes") { console.log("Cancelled. Nothing changed."); return; }

  try { await auth.updateUser(player.uid, { password: pin }); }
  catch (e) { fail(`Firebase refused the change (${e.code || e.message}). Nothing changed.`); }

  console.log(`\nDone. ${player.code || player.email} has the new PIN.`);
  console.log("- Devices still signed in as this player are signed out when their sign-in next");
  console.log("  refreshes (Firebase revokes sessions after a password change).");
  console.log("- The 30-minute PIN lock is kept on each device (kc-lock). This script cannot clear it.");
}

main().catch((e) => fail(e && e.message ? e.message : String(e)));

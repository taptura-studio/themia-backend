#!/usr/bin/env node
/**
 * Import resources from controlcenter API into D1 (resources + resource_categories).
 *
 * Usage examples:
 *   node scripts/importResources.js --mode=local --type=9 --pageSize=20 --concurrency=3
 *   node scripts/importResources.js --mode=remote --type=1 --pageSize=20
 *   node scripts/importResources.js --mode=local --type=9 --out=import.sql --use-hardcoded-categories
 *
 * Requirements:
 *   - wrangler installed (devDependency already present)
 *   - migrations applied (0001-0003)
 *
 * Notes:
 *   - Uses wrangler d1 execute for SQL unless --out is provided.
 *   - Escapes single quotes in text fields before embedding in SQL.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");

const args = new Map(
	process.argv.slice(2).map((arg) => {
		const [k, v] = arg.replace(/^--/, "").split("=");
		return [k, v ?? true];
	})
);

const mode = args.get("mode") === "remote" ? "remote" : "local";
const type = Number(args.get("type") ?? 9);
const pageSize = Number(args.get("pageSize") ?? 20);
const concurrency = Number(args.get("concurrency") ?? 3);
const dbName = args.get("db") ?? "DB"; // matches wrangler binding name
const outFile = args.get("out"); // if set, write SQL to this file instead of executing
const useHardcodedCategories = args.has("use-hardcoded-categories");
const categoryKeysArg = args.get("categoryKeys"); // comma-separated list if provided
const disableTransactions = args.has("noTx") || args.has("no-transactions");

const HARDCODED_CATEGORY_KEYS = [
	"V8XWhNLYkZ",
	"qxdlgMtKbz",
	"Jhtf2b2QGA",
	"SsC0WrCIJU",
	"V3zvldPJq2",
	"wkUm3LWDzS",
	"MDVEwlJj7b",
	"GVNEzKLWgd",
	"mztXXw4wjN",
	"n8vO_t0Ouu",
	"TRDXfe2ZBj",
	"yqXrEM4U2t",
	"J6EGYz7Gi-",
	"81zHMlMInF",
	"U2mXQGfFQ9",
	"Z2tSbXqP8P",
	"BvQGZLySMM",
	"X_Dfn04kXN",
	"JHFXIsYJbS",
	"cktMcsrvzX",
	"Ls1IP6B_h7",
];

function runSQL(sql) {
	const cmd = `npx wrangler d1 execute ${dbName} --${mode} --command "${sql.replace(/"/g, '\\"')}"`;
	return execSync(cmd, { stdio: "pipe" }).toString();
}

function emitSQL(sql) {
	if (outFile) {
		fs.appendFileSync(outFile, sql + "\n");
	} else {
		runSQL(sql);
	}
}

function fetchCategories() {
	if (categoryKeysArg) {
		return categoryKeysArg
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}
	if (useHardcodedCategories) {
		return HARDCODED_CATEGORY_KEYS;
	}
	const out = execSync(
		`npx wrangler d1 execute ${dbName} --${mode} --command "SELECT key FROM categories" --json`,
		{ stdio: "pipe" }
	).toString();
	const parsed = JSON.parse(out);
	return parsed[0].results.map((r) => r.key);
}

async function fetchPage(categoryKey, pageNum, attempt = 1) {
	const url = `https://api.controlcenter.live/v1/theme/getResourceListByCategoryKey?categoryKeyList=${categoryKey}&type=${type}&pageNum=${pageNum}&pageSize=${pageSize}&sign=925afc907989cdae66bb735844da9d1d`;
	try {
		const resp = await fetch(url, { headers: API_HEADERS, keepalive: true });
		if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
		const json = await resp.json();
		return json?.data?.resourceList ?? [];
	} catch (err) {
		if (attempt < 4) {
			const delay = 500 * attempt; // simple backoff
			await new Promise((res) => setTimeout(res, delay));
			return fetchPage(categoryKey, pageNum, attempt + 1);
		}
		throw err;
	}
}

const API_HEADERS = {
	"User-Agent":
		"com.ioscontrol.themed.control.center.smart/16 (1d3c20aee9f8eed9c129924441ec0100/6892de546df4499b8b27ed6725a41ce7) Country/GB Language/en System/android Version/28 Screen/420 AbTest/0 Device/iphone Filter/0",
	"Accept-Charset": "UTF-8",
	"Accept-Language": "en_GB",
	"X-Model": "SM-G970F",
	"Api-Version": "18",
	"Res-Version": "1",
	"Test-Status": "0",
	Cookie: "JSESSIONID=42E2C46A4A8CCA8B04BD4EE691D9C80E",
};

function esc(str = "") {
	return String(str).replace(/'/g, "''");
}

function upsertResource(resource, categoryKey) {
	const body = `
INSERT OR IGNORE INTO resources (key, name, thumb, isFree, type, isHot, isGif, isNew, isMore, isContact, wallpaperType, packageUrl)
VALUES ('${esc(resource.key)}','${esc(resource.name)}','${esc(resource.thumb)}',${Number(resource.isFree) || 0},${Number(resource.type) || 0},${Number(resource.isHot) || 0},${Number(
		resource.isGif
	) || 0},${Number(resource.isNew) || 0},${Number(resource.isMore) || 0},${Number(resource.isContact) || 0},${Number(resource.wallpaperType) || 0},'${esc(
		resource.packageUrl
	)}');
UPDATE resources SET
  name='${esc(resource.name)}',
  thumb='${esc(resource.thumb)}',
  isFree=${Number(resource.isFree) || 0},
  type=${Number(resource.type) || 0},
  isHot=${Number(resource.isHot) || 0},
  isGif=${Number(resource.isGif) || 0},
  isNew=${Number(resource.isNew) || 0},
  isMore=${Number(resource.isMore) || 0},
  isContact=${Number(resource.isContact) || 0},
  wallpaperType=${Number(resource.wallpaperType) || 0},
  packageUrl='${esc(resource.packageUrl)}'
WHERE key='${esc(resource.key)}';
INSERT OR IGNORE INTO resource_categories (resource_key, category_key)
VALUES ('${esc(resource.key)}','${esc(categoryKey)}');
`;

	const sql = disableTransactions ? body : `BEGIN TRANSACTION;\n${body}COMMIT;\n`;
	emitSQL(sql);
}

async function processCategory(categoryKey) {
	for (let page = 1; ; page++) {
		console.log(`[${categoryKey}] page ${page} fetching...`);
		const list = await fetchPage(categoryKey, page);
		console.log(`[${categoryKey}] page ${page} received ${list.length} items`);
		if (!list.length) break;
		for (const item of list) {
			upsertResource(item, categoryKey);
		}
		console.log(`[${categoryKey}] page ${page} processed`);
		if (list.length < pageSize) {
			console.log(`[${categoryKey}] done at page ${page}`);
			break; // reached last page
		}
	}
}

async function run() {
	const categoryKeys = fetchCategories();
	if (outFile) {
		fs.writeFileSync(
			outFile,
			`-- Generated by importResources.js\n-- mode=${mode} type=${type} pageSize=${pageSize} concurrency=${concurrency}\n\n`
		);
	}
	console.log(
		`${outFile ? "Generating SQL" : "Importing"} type=${type}, pageSize=${pageSize}, categories=${categoryKeys.length}`
	);

	let idx = 0;
	const workers = Array(Math.min(concurrency, categoryKeys.length))
		.fill(null)
		.map(async () => {
			while (idx < categoryKeys.length) {
				const cat = categoryKeys[idx++];
				console.log(`> Category ${cat}`);
				await processCategory(cat);
			}
		});
	await Promise.all(workers);
	console.log("Done");
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});

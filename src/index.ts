export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === "/categories") {
			return handleCategories(url, env);
		}

		if (url.pathname === "/resources") {
			return handleResources(url, env);
		}

		return Response.json({ error: "not found" }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;

async function handleCategories(url: URL, env: Env) {
	const typeParam = Number(url.searchParams.get("type") || "9");
	if (Number.isNaN(typeParam)) {
		return Response.json({ error: "type is required and must be a number" }, { status: 400 });
	}

	const stmt = env.DB.prepare(
		"SELECT key, name, type, lockType, size, copyrightLevel FROM categories WHERE type = ? ORDER BY id"
	);
	const { results } = await stmt.bind(typeParam).all();

	return Response.json({
		errorCode: 0,
		errorMsg: "ok",
		data: {
			type: typeParam,
			categoryList: results,
		},
	});
}

async function handleResources(url: URL, env: Env) {
	const categoryKeysParam = url.searchParams.get("categoryKeyList") || "";
	const typeParam = Number(url.searchParams.get("type") || "9");
	const pageNum = Math.max(1, Number(url.searchParams.get("pageNum") || "1"));
	const pageSize = Math.min(
		50,
		Math.max(1, Number(url.searchParams.get("pageSize") || "20"))
	);
	const categoryKeys = categoryKeysParam
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	if (Number.isNaN(typeParam)) {
		return Response.json({ error: "type is required and must be a number" }, { status: 400 });
	}

	if (!categoryKeys.length) {
		return Response.json(
			{ error: "categoryKeyList is required" },
			{ status: 400 }
		);
	}

	// Build dynamic IN list placeholders
	const placeholders = categoryKeys.map(() => "?").join(",");
	const offset = (pageNum - 1) * pageSize;

	const stmt = env.DB.prepare(
		`SELECT r.* FROM resources r
     JOIN resource_categories rc ON rc.resource_key = r.key
     WHERE rc.category_key IN (${placeholders}) AND r.type = ?
     ORDER BY r.id
     LIMIT ? OFFSET ?`
	);

	const bindings = [...categoryKeys, typeParam, pageSize, offset];
	const { results } = await stmt.bind(...bindings).all();

	return Response.json({
		errorCode: 0,
		errorMsg: "ok",
		data: {
			pageNum,
			pageSize,
			categoryKeyList: categoryKeys,
			type: typeParam,
			resourceList: results,
		},
	});
}

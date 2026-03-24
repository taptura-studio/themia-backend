# Worker + D1 Database

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/d1-template)

![Worker + D1 Template Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/cb7cb0a9-6102-4822-633c-b76b7bb25900/public)

<!-- dash-content-start -->

D1 is Cloudflare's native serverless SQL database ([docs](https://developers.cloudflare.com/d1/)). This project demonstrates using a Worker with a D1 binding to execute a SQL statement. A simple frontend displays the result of this query:

```SQL
SELECT * FROM comments LIMIT 3;
SELECT key, name, type, lockType, size, copyrightLevel FROM categories LIMIT 10;
```

The D1 database is initialized with a `comments` table and this data:

```SQL
INSERT INTO comments (author, content)
VALUES
    ('Kristian', 'Congrats!'),
    ('Serena', 'Great job!'),
    ('Max', 'Keep up the good work!')
;

A `categories` table is also created and seeded with the categories provided in the integration feed (fields: `key`, `name`, `type`, `lockType`, `size`, `copyrightLevel`).

The `resources` and `resource_categories` tables store resource metadata and the many-to-many links to categories. The Worker exposes `/resources?categoryKeyList=...&type=...&pageNum=1&pageSize=20` to query from D1.
```

> [!IMPORTANT]
> When using C3 to create this project, select "no" when it asks if you want to deploy. You need to follow this project's [setup steps](https://github.com/cloudflare/templates/tree/main/d1-template#setup-steps) before deploying.

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```
npm create cloudflare@latest -- --template=cloudflare/templates/d1-template
```

A live public deployment of this template is available at [https://d1-template.templates.workers.dev](https://d1-template.templates.workers.dev)

## Setup Steps

1. Install the project dependencies with a package manager of your choice:
   ```bash
   npm install
   ```
2. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "d1-template-database":
   ```bash
   npx wrangler d1 create d1-template-database
   ```
   ...and update the `database_id` field in `wrangler.json` with the new database ID.
3. Run the following db migration to initialize the database (notice the `migrations` directory in this project). This applies the comments table (0001), the categories feed (0002), and the resources/link tables (0003):
   ```bash
   npx wrangler d1 migrations apply --remote d1-template-database
   ```
4. (Optional) Import resources from the external API into D1:
   ```bash
   pnpm import:resources   # local DB, type=9
   # or remote:
   node scripts/importResources.mjs --mode=remote --type=9 --pageSize=20 --concurrency=3
   # or only generate SQL (no execute):
   node scripts/importResources.mjs --mode=local --type=9 --out=import.sql
   ```
5. Deploy the project!
   ```bash
   npx wrangler deploy
   ```


node scripts/importResources.js --mode=remote --type=1 --pageSize=50 --concurrency=2 --noTx \
  --categoryKeys=BvQGZLySMM,X_Dfn04kXN,JHFXIsYJbS,cktMcsrvzX,Ls1IP6B_h7


  node scripts/importResources.js --mode=remote --type=1 --pageSize=50 --concurrency=2 --noTx \
  --categoryKeys=Ls1IP6B_h7

  node scripts/importResources.js --mode=remote --type=1 --pageSize=50 --concurrency=2 --noTx \
  --categoryKeys=cktMcsrvzX

    node scripts/importResources.js --mode=remote --type=1 --pageSize=50 --concurrency=2 --noTx \
  --categoryKeys=JHFXIsYJbS

      node scripts/importResources.js --mode=remote --type=1 --pageSize=50 --concurrency=2 --noTx \
  --categoryKeys=X_Dfn04kXN
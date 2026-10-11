$file = "c:\Users\rahul\Downloads\source_code (3)\backend\src\index.ts"
$c = Get-Content $file -Raw

# Replace edgespark.db with db
$c = $c -replace 'edgespark\.db\.', 'db.'
$c = $c -replace 'edgespark\.db', 'db'

# Fix imports
$c = $c -replace 'import type \{ Client \} from "@sdk/server-types";', ''
$c = $c -replace 'import \{ tables, buckets \} from "@generated";', "import * as tables from './db/schema.ts';`nimport { buckets } from './db/schema.ts';`nimport { db } from './db/index.ts';"

# Replace app init
$c = $c -replace 'export default function createRoutes\(edgespark: Client\) \{', ''
$c = $c -replace 'const app = new Hono<\{ Bindings: \{ client: Client \} \}>\(\);', "const app = new Hono();"

# Remove the closing brace of createRoutes if it exists at the end
# Since we removed `export default function createRoutes(...) {`, we need to remove the matching `}` and `return app;`
$c = $c -replace 'return app;\s*\}', ''

# Add node server export at the bottom
$c += "`nimport { serve } from '@hono/node-server';`n"
$c += "import { initDb } from './db/index.ts';`n"
$c += "import { cors } from 'hono/cors';`n"
$c += "app.use('/api/*', cors());`n"
$c += "initDb();`n"
$c += "serve({ fetch: app.fetch, port: 3000 }, (info) => { console.log(`Listening on http://localhost:${info.port}`); });`n"

Set-Content $file $c -NoNewline
Write-Output "Updated backend/src/index.ts"

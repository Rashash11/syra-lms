import fs from 'node:fs';
import path from 'node:path';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiCallSite {
    file: string;
    line: number;
    callee: 'fetch' | 'apiFetch';
    method: HttpMethod;
    rawPath: string;
    normalizedPath: string;
}

interface OpenApiRoute {
    method: HttpMethod;
    path: string;
}

const ROOT_DIR = process.cwd();
const WEB_SRC = path.join(ROOT_DIR, 'apps', 'web', 'src');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');

const isHttpMethod = (value: string): value is HttpMethod =>
    value === 'GET' || value === 'POST' || value === 'PUT' || value === 'PATCH' || value === 'DELETE';

const ensureDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const listFiles = (dir: string, acc: string[] = []) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build') {
                continue;
            }
            listFiles(full, acc);
            continue;
        }
        if (entry.isFile()) {
            if (full.endsWith('.ts') || full.endsWith('.tsx')) {
                acc.push(full);
            }
        }
    }
    return acc;
};

const indexToLine = (content: string, index: number) => content.slice(0, index).split('\n').length;

const normalizeApiPath = (raw: string) => {
    const withoutQuery = raw.split('?')[0];
    let i = 0;
    return withoutQuery.replace(/\$\{[^}]+\}/g, () => `{param${++i}}`);
};

const extractMethodNearby = (content: string, matchIndex: number): HttpMethod => {
    const snippet = content.slice(matchIndex, Math.min(content.length, matchIndex + 500));
    const methodMatch = snippet.match(/\bmethod\s*:\s*['"]([A-Z]+)['"]/);
    if (!methodMatch) return 'GET';
    const m = methodMatch[1];
    return isHttpMethod(m) ? m : 'GET';
};

const findApiCallsInFile = (filePath: string): ApiCallSite[] => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const results: ApiCallSite[] = [];

    const add = (callee: 'fetch' | 'apiFetch', rawPath: string, index: number) => {
        if (!rawPath.startsWith('/api/')) return;
        const method = extractMethodNearby(content, index);
        results.push({
            file: path.relative(ROOT_DIR, filePath).replace(/\\/g, '/'),
            line: indexToLine(content, index),
            callee,
            method,
            rawPath,
            normalizedPath: normalizeApiPath(rawPath),
        });
    };

    const quoted = /\b(apiFetch|fetch)\(\s*(['"])(\/api\/[^'"]+)\2/g;
    for (const match of content.matchAll(quoted)) {
        const callee = match[1] === 'apiFetch' ? 'apiFetch' : 'fetch';
        add(callee, match[3], match.index ?? 0);
    }

    const templated = /\b(apiFetch|fetch)\(\s*`([^`]+)`/g;
    for (const match of content.matchAll(templated)) {
        const callee = match[1] === 'apiFetch' ? 'apiFetch' : 'fetch';
        const raw = match[2];
        if (!raw.startsWith('/api/')) continue;
        add(callee, raw, match.index ?? 0);
    }

    return results;
};

const pathToRegex = (p: string) => {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withParams = escaped.replace(/\\\{[^}]+\\\}/g, '[^/]+');
    return new RegExp(`^${withParams}$`);
};

const loadOpenApiRoutes = async (): Promise<{ base: string; routes: OpenApiRoute[]; paths: Record<string, any> } | null> => {
    const base = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8001';
    const url = `${base}/api/openapi.json`;
    try {
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (!res.ok) return null;
        const json = await res.json();
        const paths = json.paths || {};
        const routes: OpenApiRoute[] = [];
        for (const p of Object.keys(paths)) {
            const methodsObj = paths[p] || {};
            for (const m of Object.keys(methodsObj)) {
                const upper = m.toUpperCase();
                if (isHttpMethod(upper)) {
                    routes.push({ method: upper, path: p });
                }
            }
        }
        return { base, routes, paths };
    } catch {
        return null;
    }
};

const uniqBy = <T>(items: T[], key: (t: T) => string) => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
        const k = key(item);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(item);
    }
    return out;
};

async function main() {
    console.log('🔗 Building frontend → backend call graph...');

    const files = listFiles(WEB_SRC);
    const calls = files.flatMap(findApiCallsInFile);
    const uniqueCalls = uniqBy(calls, (c) => `${c.method} ${c.normalizedPath}`);

    console.log(`Found ${calls.length} callsites, ${uniqueCalls.length} unique API calls.`);

    const openapi = await loadOpenApiRoutes();
    if (!openapi) {
        console.log('⚠️ Could not load backend OpenAPI (is FastAPI running at PYTHON_BACKEND_URL?).');
    }

    const matched: Array<ApiCallSite & { matches: OpenApiRoute[] }> = [];
    const unmatched: ApiCallSite[] = [];

    if (openapi) {
        for (const call of uniqueCalls) {
            const callRegex = pathToRegex(call.normalizedPath);
            const matches = openapi.routes.filter((r) => r.method === call.method && callRegex.test(r.path));
            if (matches.length === 0) unmatched.push(call);
            else matched.push({ ...call, matches });
        }
    } else {
        unmatched.push(...uniqueCalls);
    }

    const usedBackend = new Set<string>();
    if (openapi) {
        for (const m of matched) {
            for (const r of m.matches) usedBackend.add(`${r.method} ${r.path}`);
        }
    }

    const unusedBackend: OpenApiRoute[] =
        openapi ? openapi.routes.filter((r) => !usedBackend.has(`${r.method} ${r.path}`)) : [];

    ensureDir(ARTIFACTS_DIR);
    const jsonOut = {
        generatedAt: new Date().toISOString(),
        backend: openapi?.base ?? null,
        counts: {
            callsites: calls.length,
            uniqueCalls: uniqueCalls.length,
            matchedCalls: matched.length,
            unmatchedCalls: unmatched.length,
            backendRoutes: openapi?.routes.length ?? null,
            unusedBackendRoutes: openapi ? unusedBackend.length : null,
        },
        unmatched: unmatched.slice(0, 200),
        matched: matched.slice(0, 200),
        unusedBackend: unusedBackend.slice(0, 200),
    };
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'api-callgraph.json'), JSON.stringify(jsonOut, null, 2));

    const mdLines: string[] = [];
    mdLines.push(`# API Call Graph`);
    mdLines.push('');
    mdLines.push(`- Generated: ${jsonOut.generatedAt}`);
    mdLines.push(`- Backend: ${jsonOut.backend ?? 'N/A'}`);
    mdLines.push(`- Callsites: ${jsonOut.counts.callsites}`);
    mdLines.push(`- Unique calls: ${jsonOut.counts.uniqueCalls}`);
    mdLines.push(`- Matched unique calls: ${jsonOut.counts.matchedCalls}`);
    mdLines.push(`- Unmatched unique calls: ${jsonOut.counts.unmatchedCalls}`);
    if (openapi) {
        mdLines.push(`- Backend routes (OpenAPI): ${jsonOut.counts.backendRoutes}`);
        mdLines.push(`- Unused backend routes (sampled): ${jsonOut.counts.unusedBackendRoutes}`);
    }
    mdLines.push('');

    if (unmatched.length > 0) {
        mdLines.push(`## Unmatched Calls (sample)`);
        mdLines.push('');
        mdLines.push(`| Method | Path | File | Line |`);
        mdLines.push(`|---|---|---|---:|`);
        for (const u of unmatched.slice(0, 60)) {
            mdLines.push(`| ${u.method} | ${u.normalizedPath} | ${u.file} | ${u.line} |`);
        }
        mdLines.push('');
    }

    if (openapi && unusedBackend.length > 0) {
        mdLines.push(`## Unused Backend Routes (sample)`);
        mdLines.push('');
        mdLines.push(`| Method | Path |`);
        mdLines.push(`|---|---|`);
        for (const r of unusedBackend.slice(0, 60)) {
            mdLines.push(`| ${r.method} | ${r.path} |`);
        }
        mdLines.push('');
    }

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'api-callgraph.md'), mdLines.join('\n'));

    console.log('✅ Wrote artifacts/api-callgraph.json and artifacts/api-callgraph.md');
    if (unmatched.length > 0) {
        console.log(`❌ Unmatched unique calls: ${unmatched.length} (see artifacts/api-callgraph.md)`);
        process.exitCode = 1;
    } else {
        console.log('✅ All detected unique calls matched backend OpenAPI routes.');
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

#!/usr/bin/env node
// MCP server exposing tools for Practice 05
// Tools:
// - weather.features(date_iso, region_key)
// - validate.input(diff_size)
// - api.health()
// - spec.query(query)

const http = require('http');
const { spawnSync } = require('child_process');
const path = require('path');
const { existsSync } = require('fs');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
  });
}

function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function findPython() {
  if (process.env.PY_BIN) return process.env.PY_BIN;
  const venvPy = path.join(process.cwd(), '.venv', 'bin', 'python');
  if (existsSync(venvPy)) return venvPy;
  return 'python3';
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405; res.end('Method Not Allowed'); return;
  }
  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid_json' })); return;
  }
  const { tool, params } = body || {};
  if (!tool) {
    res.statusCode = 400; res.end(JSON.stringify({ error: 'missing_tool' })); return;
  }

  try {
    if (tool === 'weather.features') {
      const { date_iso, region_key } = params || {};
      if (!isIsoDate(date_iso)) {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'bad_date' })); return;
      }
      const pyBin = findPython();
      const code = `import json; from app.weather import fetch_features_for_date; print(json.dumps(fetch_features_for_date('${date_iso}', '${region_key || 'spb'}'), ensure_ascii=False))`;
      const py = spawnSync(pyBin, ['-c', code], { cwd: process.cwd() });
      if (py.status !== 0) {
        res.statusCode = 500; res.end(JSON.stringify({ error: 'python_failed', stderr: (py.stderr && py.stderr.toString()) || '' })); return;
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(py.stdout.toString());
      return;
    }

    if (tool === 'validate.input') {
      const { diff_size } = params || {};
      if (typeof diff_size !== 'number' || diff_size < 0) {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'bad_diff_size' })); return;
      }
      if (diff_size > 20000) {
        res.statusCode = 413; res.end(JSON.stringify({ ok: false, reason: 'diff too large' })); return;
      }
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (tool === 'api.health') {
      const pyBin = findPython();
      const code = `import json; from fastapi.testclient import TestClient; from app.api import create_app; client = TestClient(create_app()); r = client.get('/health'); print(json.dumps({'status_code': r.status_code, 'json': r.json()}))`;
      const py = spawnSync(pyBin, ['-c', code], { cwd: process.cwd() });
      if (py.status !== 0) {
        res.statusCode = 500; res.end(JSON.stringify({ error: 'health_check_failed', stderr: (py.stderr && py.stderr.toString()) || '' })); return;
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(py.stdout.toString());
      return;
    }

    if (tool === 'spec.query') {
      const { query } = params || {};
      if (!query || typeof query !== 'string') {
        res.statusCode = 400; res.end(JSON.stringify({ error: 'bad_query' })); return;
      }
      const gitSpecBin = path.join(process.cwd(), 'node_modules', '.bin', 'git-spec');
      const gitSpec = spawnSync(gitSpecBin, ['query', query], { cwd: process.cwd() });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: gitSpec.status === 0,
        output: gitSpec.stdout ? gitSpec.stdout.toString() : '',
        error: gitSpec.stderr ? gitSpec.stderr.toString() : '',
      }));
      return;
    }

    res.statusCode = 404; res.end(JSON.stringify({ error: 'unknown_tool' }));
  } catch (e) {
    res.statusCode = 500; res.end(JSON.stringify({ error: 'internal', message: String(e) }));
  }
});

const port = process.env.MCP_PORT || 8777;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`practice05 MCP listening on ${port}`);
});

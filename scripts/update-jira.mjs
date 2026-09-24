import fs from 'node:fs';
import path from 'node:path';

const baseUrl = (process.env.JIRA_BASE_URL || '').replace(/\/$/, '');
const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_API_TOKEN;
const issueKey = process.env.JIRA_ISSUE_KEY;
const event = process.env.JIRA_EVENT || 'verification';
const result = process.env.TEST_RESULT || 'unknown';
const deployUrl = process.env.DEPLOY_URL || '';
const runUrl = process.env.RUN_URL || '';
const targetStatus = process.env.TARGET_STATUS || '';

if (!baseUrl || !email || !token || !issueKey) {
  throw new Error('Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_ISSUE_KEY.');
}

const auth = Buffer.from(`${email}:${token}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

async function jira(url, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const body = await response.text();
  if (!response.ok) throw new Error(`Jira ${response.status} ${url}: ${body}`);
  return body ? JSON.parse(body) : {};
}

function paragraph(text) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const statusLine = result === 'success' ? 'PASS' : result === 'failure' ? 'FAIL' : result.toUpperCase();
const text = [
  `[Replay2Proof] ${event}`,
  `Verification result: ${statusLine}`,
  deployUrl ? `Deployed URL: ${deployUrl}` : '',
  runUrl ? `GitHub run: ${runUrl}` : '',
  'Evidence is available in the GitHub Actions artifacts: video, screenshot/trace when applicable, browser-evidence.json, and HTML report.'
].filter(Boolean).join('\n');

await jira(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
  method: 'POST',
  body: JSON.stringify({ body: { version: 1, type: 'doc', content: text.split('\n').map(paragraph) } })
});

const artifactDir = process.env.ARTIFACT_DIR || 'test-results';
if (fs.existsSync(artifactDir)) {
  const files = fs.readdirSync(artifactDir, { recursive: true })
    .map(file => path.join(artifactDir, file))
    .filter(file => fs.statSync(file).isFile());

  for (const file of files) {
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(file)]), path.basename(file));
    const response = await fetch(`${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'X-Atlassian-Token': 'no-check', Accept: 'application/json' },
      body: form
    });
    if (!response.ok) console.log(`Attachment skipped (${response.status}): ${file}`);
  }
}

if (targetStatus) {
  const transitions = await jira(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`);
  const match = (transitions.transitions || []).find(t => t.to?.name?.toLowerCase() === targetStatus.toLowerCase());
  if (match) {
    await jira(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ transition: { id: match.id } })
    });
    console.log(`Transitioned ${issueKey} to ${match.to.name}`);
  } else {
    console.log(`No available Jira transition to '${targetStatus}'. Update the status manually.`);
  }
}

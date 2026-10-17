'use strict';
// ===================================================================
// GITHUB — the few REST calls the scheduled workflows make on issues
//
// scripts/health.js keeps one "Site health" issue and scripts/review.js
// opens one "Quarterly review" issue a quarter. Both talk to the REST API
// with the workflow's GITHUB_TOKEN through this, and both take the fetch
// they use as a parameter, so tests/health.test.js drives them against a
// stand-in for the API with no network.
//
// No third-party action and no `gh`: the calls are few, and a test can see
// every one of them.
// ===================================================================

const API = 'https://api.github.com';

class GitHubError extends Error {
    constructor(method, route, status, message) {
        super(`${method} ${route} answered ${status}${message ? `: ${message}` : ''}`);
        this.status = status;
    }
}

/**
 * A client for one repository ("owner/name"). `request` throws a
 * GitHubError for any status but the ones `ok` lists (2xx by default), with
 * the API's own message, which names what is wrong and never the token.
 */
function client({ fetch, token, repo, api = API }) {
    if (typeof fetch !== 'function') throw new Error('github: no fetch');
    if (!token) throw new Error('github: no token (GITHUB_TOKEN)');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error(`github: "${repo}" is not owner/name (GITHUB_REPOSITORY)`);

    async function request(method, route, body, ok = (s) => s >= 200 && s < 300) {
        const res = await fetch(`${api}${route}`, {
            method,
            headers: {
                accept: 'application/vnd.github+json',
                authorization: `Bearer ${token}`,
                'x-github-api-version': '2022-11-28',
                'user-agent': `${repo} scheduled checks`,
                ...(body ? { 'content-type': 'application/json' } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (e) { /* not JSON */ }
        if (!ok(res.status)) throw new GitHubError(method, route, res.status, json && json.message);
        return { status: res.status, json };
    }

    const issues = `/repos/${repo}/issues`;
    return {
        repo,
        request,
        /**
         * Issues (never pull requests, which the same endpoint lists) matching
         * a query such as { state: 'open', labels: 'health' }, one page of 100.
         */
        async listIssues(query) {
            const qs = new URLSearchParams({ per_page: '100', ...query }).toString();
            const { json } = await request('GET', `${issues}?${qs}`);
            return (Array.isArray(json) ? json : []).filter(i => !i.pull_request);
        },
        /**
         * Makes sure a label exists. An issue opened with a label nobody has
         * made yet may lose it, and each workflow finds its issues by label.
         * 422 is "already exists".
         */
        async ensureLabel(name, color, description) {
            await request('POST', `/repos/${repo}/labels`, { name, color, description }, s => (s >= 200 && s < 300) || s === 422);
        },
        async createIssue(fields) {
            return (await request('POST', issues, fields)).json;
        },
        async updateIssue(number, fields) {
            return (await request('PATCH', `${issues}/${number}`, fields)).json;
        },
        async comment(number, body) {
            return (await request('POST', `${issues}/${number}/comments`, { body })).json;
        }
    };
}

module.exports = { client, GitHubError, API };

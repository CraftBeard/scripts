// ==UserScript==
// @name         Keyword Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlights predefined keywords (whole word only) on page load
// @author       Craft Beard
// @match        *://*/*
// @exclude      https://www.inoreader.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Hardcoded keywords and their colors ---
    const keywordGroups = [
        {
            // Tech Companies: light blue
            color: '#b3d4e4',
            keywords: [
                'tencent', 'google', 'microsoft', 'apple', 'amazon',
                'meta', 'facebook', 'alibaba', 'bytedance', 'amd', 'intel'
            ]
        },
        {
            // AI Related: light green
            color: '#b7e1c5',
            keywords: [
                'openai', 'chatgpt', 'deepseek', 'qwen',
                'llama', 'gemini', 'copilot', 'mcp', 'llm', 'ollama'
            ]
        },
        {
            // Data Engineer Related: light orange
            color: '#ffe0b2',
            keywords: [
                'hadoop', 'hive', 'sql', 'spark', 'python', 'flink', 'kafka', 'airflow',
                'etl', 'pandas', 'postgresql', 'pgsql', 'mysql', 'postgres'
            ]
        },
        {
            // Stock Codes: light purple
            color: '#d1c4e9',
            keywords: [
                'qqq', 'intc', 'nvda', 'aapl', 'msft',
                'goog', 'googl', 'tsla', 'baba', 'amd', 'spy', 'soxx'
            ]
        },
        {
            // Geek Related: light pink
            color: '#e9c4c4',
            keywords: [
                'python', 'php', 'javascript', 'js', 'rust',
                'linux', 'macos', 'windows', 'nas', 'ubuntu', 'debian', 'fedora', 'centos', 'android', 'chrome', 'firefox',
                'docker', 'git', 'github', 'shell', 'bash',
                'cpu', 'ssd'
            ]
        }
    ];



    // Utility to escape special regex characters in keywords
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Collect all text nodes under the given element
    function getTextNodesUnder(el) {
        let nodes = [];
        let walker = document.createTreeWalker(
            el,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentNode && ['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentNode.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (!node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );
        let n;
        while(n = walker.nextNode()) {
            nodes.push(n);
        }
        return nodes;
    }

    function highlightKeywords() {
        keywordGroups.forEach(group => {
            // Use \b for word boundary
            const regex = new RegExp(
                '\\b(' + group.keywords.map(escapeRegExp).join('|') + ')\\b',
                'gi'
            );
            const counts = {};
            group.keywords.forEach(k => counts[k.toLowerCase()] = 0);

            const textNodes = getTextNodesUnder(document.body);

            textNodes.forEach(node => {
                let originalText = node.nodeValue;

                // Debug: count occurrences (whole word only)
                group.keywords.forEach(keyword => {
                    const kwRegex = new RegExp('\\b' + escapeRegExp(keyword) + '\\b', 'gi');
                    const matches = originalText.match(kwRegex);
                    if (matches) {
                        counts[keyword.toLowerCase()] += matches.length;
                    }
                });

                // Only replace if at least one match
                if (regex.test(originalText)) {
                    const span = document.createElement('span');
                    span.innerHTML = originalText.replace(regex, match =>
                        `<span style="background:${group.color};border-radius:2px;padding:0 2px;">${match}</span>`
                    );
                    node.parentNode.replaceChild(span, node);
                }
            });

            // Print debug info
            console.log(`Keyword group (color: ${group.color}):`);
            let foundAny = false;
            Object.entries(counts).forEach(([k, v]) => {
                if (v > 0) {
                    foundAny = true;
                    console.log(`  Found keyword "${k}": ${v} times`);
                }
            });
            if (!foundAny) {
                console.log('  No keywords found on this page.');
            }
        });
    }

    window.onload = highlightKeywords;

})();

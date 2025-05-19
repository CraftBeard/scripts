// ==UserScript==
// @name         Google Search Data Range Bar
// @namespace    Violentmonkey Scripts
// @version      1.0
// @description  Adds a top navigation bar with multiple date filter buttons to Google Search (all domains), highlights active button
// @author       Craft Beard
// @match        https://www.google.*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.getElementById('custom-top-navbar')) return;

    // Inject style for active button
    const style = document.createElement('style');
    style.textContent = `
        .active-date-btn {
            background: #4285f4 !important;
            color: #fff !important;
            border-color: #4285f4 !important;
        }
    `;
    document.head.appendChild(style);

    function formatDateUS(date) {
        const mm = date.getMonth() + 1;
        const dd = date.getDate();
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    }

    function removeTbs(url) {
        return url.replace(/([&?])tbs=[^&]*/g, '').replace(/[?&]+$/, '');
    }

    function addTbsToUrl(url, tbsParam) {
        url = removeTbs(url);
        url += (url.includes('?') ? '&' : '?');
        url += tbsParam;
        return url;
    }

    const buttonDefs = [
        ['Past 1 day',    now => { let d = new Date(now); d.setDate(d.getDate() - 1); return d; }],
        ['Past 1 week',   now => { let d = new Date(now); d.setDate(d.getDate() - 7); return d; }],
        ['Past 2 weeks',  now => { let d = new Date(now); d.setDate(d.getDate() - 14); return d; }],
        ['Past 1 mth',    now => { let d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }],
        ['Past 3 mths',   now => { let d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }],
        ['Past 6 mths',   now => { let d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }],
        ['Past 1 year',   now => { let d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }],
        ['Past 3 years',  now => { let d = new Date(now); d.setFullYear(d.getFullYear() - 3); return d; }],
    ];

    const navbar = document.createElement('div');
    navbar.id = 'custom-top-navbar';
    navbar.style.position = 'fixed';
    navbar.style.top = '0';
    navbar.style.left = '0';
    navbar.style.width = '100%';
    navbar.style.height = '48px';
    navbar.style.background = '#fff';
    navbar.style.zIndex = '9999';
    navbar.style.display = 'flex';
    navbar.style.alignItems = 'center';
    navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    navbar.style.paddingLeft = '24px';
    navbar.style.gap = '8px';

    // Store button references for easy reset
    const buttons = [];

    buttonDefs.forEach(([label, getMinDate]) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.padding = '8px 14px';
        button.style.fontSize = '14px';
        button.style.cursor = 'pointer';
        button.style.border = '1px solid #ddd';
        button.style.borderRadius = '4px';
        button.style.background = '#f8f9fa';

        button.onclick = function(e) {
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active-date-btn'));
            // Add to clicked
            button.classList.add('active-date-btn');

            const now = new Date();
            const minDate = getMinDate(now);
            const cd_min = formatDateUS(minDate);
            const cd_max = formatDateUS(now);
            const tbs = `tbs=cdr:1,cd_min:${cd_min},cd_max:${cd_max}`;
            const url = addTbsToUrl(window.location.href, tbs);
            window.location.href = url;
        };

        buttons.push(button);
        navbar.appendChild(button);
    });

    document.body.appendChild(navbar);
    document.body.style.marginTop = '48px';

    // Highlight active button based on URL (on page load)
    function highlightActiveButton() {
        const params = new URLSearchParams(window.location.search);
        const tbs = params.get('tbs');
        if (!tbs || !tbs.startsWith('cdr:1')) return;
        const cd_min_match = tbs.match(/cd_min:([\d/]+)/);
        const cd_max_match = tbs.match(/cd_max:([\d/]+)/);
        if (!cd_min_match || !cd_max_match) return;
        const cd_min = cd_min_match[1];
        const cd_max = cd_max_match[1];

        // Find which button matches this range
        buttons.forEach((btn, idx) => {
            const now = new Date();
            const minDate = buttonDefs[idx][1](now);
            const minStr = formatDateUS(minDate);
            const maxStr = formatDateUS(now);
            if (cd_min === minStr && cd_max === maxStr) {
                btn.classList.add('active-date-btn');
            } else {
                btn.classList.remove('active-date-btn');
            }
        });
    }

    highlightActiveButton();
})();

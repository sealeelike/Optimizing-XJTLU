// ==UserScript==
// @name         Learningmall 课程卡片优化
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  去除彩图，提取代码，悬浮菜单，消除链接下划线，引入防抖极致优化性能
// @match        *://core.xjtlu.edu.cn/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 1. 注入全面优化的 CSS
    GM_addStyle(`
        /* 隐藏顶部的无用 SVG/图片容器 */
        .card-img-top {
            display: none !important;
        }

        /* 整卡基础交互 */
        .card.course-card {
            cursor: pointer !important;
            transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease !important;
            position: relative !important;
            overflow: visible !important;
        }

        .card.course-card:hover {
            transform: translateY(-6px) !important;
            box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
            z-index: 50 !important;
        }

        /* --- 弹出层核心样式 --- */
        .custom-popup-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(4px);
            border-top: 1px solid rgba(0,0,0,0.05);
            border-radius: 0 0 8px 8px;
            padding: 8px 12px !important;
            box-sizing: border-box;
            z-index: 100;

            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .card.course-card:hover .custom-popup-footer {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .custom-popup-footer .card-footer {
            background: transparent !important;
            padding: 0 !important;
        }

        /* --- 字体与文本优化 (解决下划线问题) --- */
        /* 强制去除原 a 标签及其内部文字的下划线 */
        .card.course-card a.coursename,
        .card.course-card a.coursename:hover,
        .card.course-card a.coursename:focus {
            text-decoration: none !important;
            color: inherit !important; /* 防止变成系统默认蓝色链接 */
        }

        .custom-course-code {
            font-size: 26px !important;
            font-weight: 700 !important;
            color: #1a2b3c !important;
            display: block;
            margin-bottom: 24px;
            /* 鼠标变成常规箭头，弱化文字是链接的感知 */
            cursor: pointer;
        }

        .custom-small-text {
            font-size: 13px !important;
            color: #666 !important;
            line-height: 1.4 !important;
            white-space: normal !important;
            display: block;
            margin-bottom: 24px;
        }
    `);

    function optimizeCards() {
        const cards = document.querySelectorAll('.card.course-card:not([data-optimized="true"])');
        if (cards.length === 0) return; // 如果没有新卡片，直接退出，节省算力

        cards.forEach(card => {
            const link = card.querySelector('a.coursename');
            if (!link) return;

            const url = link.href;
            const titleSpan = link.querySelector('.multiline');

            let fullText = "";
            if (titleSpan) {
                fullText = titleSpan.getAttribute('title') || titleSpan.innerText.trim();
            } else {
                fullText = link.innerText.trim();
            }

            const match = fullText.match(/([A-Za-z]{3}\d{3})/);

            if (match) {
                const codeDiv = document.createElement('div');
                codeDiv.className = 'custom-course-code';
                codeDiv.innerText = match[1];

                if (titleSpan) {
                    titleSpan.style.display = 'none';
                    titleSpan.parentNode.insertBefore(codeDiv, titleSpan);
                }
            } else {
                if (titleSpan) {
                    titleSpan.classList.add('custom-small-text');
                    const textContainer = card.querySelector('.text-truncate');
                    if (textContainer) textContainer.classList.remove('text-truncate');
                }
            }

            card.title = fullText;

            const footerContainer = card.querySelector('.d-flex.align-items-start:has(.card-footer)');
            if (footerContainer) {
                footerContainer.classList.add('custom-popup-footer');
            }

            card.addEventListener('click', function(e) {
                if (e.target.closest('.custom-popup-footer') ||
                    e.target.closest('[data-region="favourite-icon"]')) {
                    return;
                }
                window.location.href = url;
            });

            card.setAttribute('data-optimized', 'true');
        });
    }

    // 2. 性能优化：引入防抖 (Debounce) 机制
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
        // 如果 200 毫秒内又发生变动，就取消上一次的执行计划，重新计时
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            optimizeCards();
        }, 200);
    });

    // 只监听指定的容器可以进一步优化性能，但为了兼容性，依然监听 body，靠防抖解决卡顿
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(optimizeCards, 300);

})();

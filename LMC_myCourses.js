// ==UserScript==
// @name         Learningmall 课程卡片优化
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  去除彩图，提取代码（大字高亮显示），悬浮菜单，消除下划线，保留原结构安全插入，应用现代UI动画
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

        /* 整卡基础交互 (保留原结构的 padding/margin，只做动画和阴影) */
        .card.course-card {
            cursor: pointer !important;
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
            position: relative !important;
            overflow: visible !important;
            will-change: transform, box-shadow;
        }

        /* 🚀 解决悬浮抖动安全区 */
        .card.course-card:hover::after {
            content: '';
            position: absolute;
            left: 0; right: 0; bottom: -12px;
            height: 12px;
            background: transparent;
        }

        .card.course-card:hover {
            transform: translateY(-6px) !important;
            box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
            z-index: 50 !important;
        }

        .card.course-card:active {
            transform: translateY(-6px) scale(0.97) !important;
            transition: transform 0.1s ease-out !important;
        }

        /* 弹出层核心样式 */
        .custom-popup-footer {
            position: absolute;
            bottom: 0; left: 0; width: 100%;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(8px);
            border-top: 1px solid rgba(0,0,0,0.05);
            border-radius: 0 0 8px 8px;
            padding: 8px 12px !important;
            box-sizing: border-box;
            z-index: 100;

            opacity: 0;
            visibility: hidden;
            transform: translateY(8px) scale(0.95);
            transform-origin: bottom center;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card.course-card:hover .custom-popup-footer {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        .custom-popup-footer .card-footer {
            background: transparent !important;
            padding: 0 !important;
        }

        /* 字体与文本优化 */
        .card.course-card a.coursename,
        .card.course-card a.coursename:hover,
        .card.course-card a.coursename:focus {
            text-decoration: none !important;
            color: inherit !important; 
        }

        /* MTH102 醒目大字样式 */
        .custom-course-code {
            font-size: 30px !important;
            font-weight: 800 !important;
            color: #1a2b3c !important;
            display: block;
            margin-bottom: 6px !important;
            letter-spacing: 0.5px;
            line-height: 1.1;
            word-break: break-word;
        }

        /* Engineering Mathematics II 副标题样式 */
        .custom-small-text {
            font-size: 14px !important;
            color: #666 !important;
            line-height: 1.4 !important;
            white-space: normal !important;
            display: block;
            margin-bottom: 12px;
        }
    `);

    function optimizeCards() {
        const cards = document.querySelectorAll('.card.course-card:not([data-optimized="true"])');
        if (cards.length === 0) return; 

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

            // 【修复核心1】避开转义坑，使用 [0-9] 替代 \\d，彻底解决匹配失败问题
            const match = fullText.match(/([A-Za-z]{3}[0-9]{3})/);

            if (match) {
                const courseCode = match[1]; // 比如 MTH102
                // 剔除杂项，留下纯粹的课程名称
                const courseName = fullText.replace(courseCode, '').replace(/^[-_ \t0-9S]+/, '').trim(); 

                // 如果还没注入过，才注入，防止重复
                if (!card.querySelector('.custom-course-code')) {
                    const codeDiv = document.createElement('div');
                    codeDiv.className = 'custom-course-code';
                    codeDiv.innerText = courseCode;

                    if (titleSpan) {
                        // 【修复核心2】不再暴力清空 innerHTML！保留原本的 span，只修改文字并加上副标题样式
                        titleSpan.innerText = courseName;
                        titleSpan.classList.add('custom-small-text');
                        
                        // 去除省略号截断，让其自然换行
                        const textContainer = card.querySelector('.text-truncate');
                        if (textContainer) textContainer.classList.remove('text-truncate');

                        // 将大字安全地插在副标题前面，保留 Moodle 原生排版高度
                        titleSpan.parentNode.insertBefore(codeDiv, titleSpan);
                    } else {
                        link.insertBefore(codeDiv, link.firstChild);
                    }
                }
            } else {
                if (titleSpan) {
                    titleSpan.classList.add('custom-small-text');
                    const textContainer = card.querySelector('.text-truncate');
                    if (textContainer) textContainer.classList.remove('text-truncate');
                }
            }

            card.title = fullText;

            // 处理底部悬浮
            const footerContainer = card.querySelector('.d-flex.align-items-start:has(.card-footer)') || card.querySelector('.card-footer');
            if (footerContainer) {
                footerContainer.classList.add('custom-popup-footer');
            }

            // 点击跳转
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

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            optimizeCards();
        }, 200);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(optimizeCards, 300);

})();

// ==UserScript==
// @name         Dalimernet Assistant
// @version      3.7.3
// @description  달리머넷에 여러가지 기능을 추가하거나 개선합니다.
// @updateURL    https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @downloadURL  https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @match        *://dlm16.net/*
// @run-at       document-end
// ==/UserScript==

const isMobile = /Android|iPhone/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);

(() => {
	'use strict';

	fixPointHistory();
	applyReviewStyle();
	applyReviewCategory();
	applyCheckAnonymous();

	if (isMobile) return;

	applyBoardStyle();
	applyReviewSorting();
	applySearchByReviewer();
	applyKeydownEvent();
	applyNotification();
	applyBoardRefresh();
})();

function fixPointHistory() {
	if (!/dispPointhistoryList/.test(location.search)) return;

	const fixColor = (theme) => {
		const isDarkMode = theme === 'color_scheme_dark';
		const pointhistory = document.querySelector('table.pointhistory');
		pointhistory.caption.style.color = theme === 'color_scheme_dark' ? '#D4D6E1' : '#141721';
		document.querySelector('ul.nav-tabs > li.active > a').style.color = isDarkMode ? '#141721' : '';

		for (const link of pointhistory.querySelectorAll('a')) {
			link.style.color = isDarkMode ? '#141721' : '';
			link.style.textDecoration = 'underline';
		}

		for (const link of document.querySelector('.pagination-centered').querySelectorAll('a')) {
			link.style.color = isDarkMode ? '#141721' : '';
		}
	};

	let lastTheme = localStorage.currentTheme;

	new MutationObserver(() => {
		if (localStorage.currentTheme === lastTheme) return;
		lastTheme = localStorage.currentTheme;
		fixColor(localStorage.currentTheme);
	}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

	fixColor(localStorage.currentTheme);
}

function applyReviewStyle() {
	if (document.querySelector('ul.gnb a.is-selected')?.href !== 'https://dlm16.net/board_BPPP82') return;

	const boardList = document.querySelector('div.board__list' + (isMobile ? '-m' : ''));
	for (const link of boardList?.querySelectorAll('a.subject') || []) {
		if (link.dataset.alert !== '열람시 10p가 차감됩니다.') {
			link.style.setProperty('color', '#928aff', 'important');
		}
	}

	document.addEventListener(
		'click',
		(event) => {
			const reviewOpen = event.target.closest('a.reviewOpen');
			if (!reviewOpen) return;

			event.preventDefault();
			event.stopImmediatePropagation();
			location.href = reviewOpen.dataset.link;
		},
		true,
	);
}

function applyReviewCategory() {
	if (location.href.includes('board_SjQX31')) {
		for (const link of document.querySelectorAll('nav.category-nav > a.dal-btn')) {
			if (link.href == 'https://dlm16.net/board_SjQX31') continue;
			if (link.href == 'https://dlm16.net/board_SjQX31/category/458') continue;
			if (link.href == 'https://dlm16.net/board_SjQX31/category/465') continue;
			if (link.href == 'https://dlm16.net/board_SjQX31/category/466') continue;

			link.remove();
		}
	}

	document.addEventListener('click', function (e) {
		const link = e.target.closest('a');
		if (!link) return;

		const url = new URL(link.href, location.origin);
		if (url.searchParams.size) return;

		const boardMap = {
			'/board_SjQX31': '/category/458',
			'/board_coJF70': '/category/493',
			'/board_bJKb47': '/category/510',
		};

		const href = boardMap[url.pathname];
		if (href) {
			e.preventDefault();
			location.href = url.pathname + href;
		}
	});
}

function applyCheckAnonymous() {
	const commentList = document.getElementById('app-board-comment-list');
	if (!commentList) return;

	const checkAnonymous = (inputName) => {
		const inputAnonymous = document.getElementById(inputName);
		if (inputAnonymous) inputAnonymous.checked = true;
	};

	checkAnonymous('is_anonymous');

	new MutationObserver(() => {
		if (document.getElementById('recomment-write')) checkAnonymous('is_anonymous_re');
	}).observe(commentList, { childList: true, subtree: true });
}

function applyBoardStyle() {
	const tbody = document.querySelector('table.app-board-template-table > tbody');
	tbody?.querySelectorAll('tr:not(.notice)').forEach((tr) => {
		const title = tr.querySelector('td.title');
		if (!title) return;

		title.style.cursor = 'pointer';
		title.addEventListener('click', (e) => e.target.closest('a') || (location.href = title.querySelector('a[href]').href));

		const img = tr.querySelector('td.author img');
		if (img && ['여성회원', '여성회원A', '인증회원', '윙키'].includes(img.alt)) {
			title.querySelector('a').style.setProperty('color', '#f7bacb', 'important');
		}
	});
}

function applyReviewSorting() {
	if (document.querySelector('ul.gnb a.is-selected')?.href !== 'https://dlm16.net/board_BPPP82') return;

	const headers = document.querySelectorAll('.item-list-header > .item__inner');
	if (!headers) return;

	const headerMap = ['number', 'subject', 'rating', 'user', 'date', 'count', 'count_star', 'count_bad'];
	const sortState = {};

	headers.forEach((header, idx) => {
		const type = headerMap[idx];
		if (!type) return;

		header.dataset.originalText = header.textContent.trim();
		header.style.cursor = 'pointer';

		header.addEventListener('click', () => {
			sortState[type] = sortState[type] === 'desc' ? 'asc' : 'desc';
			sortBoard(type, sortState[type]);

			headers.forEach((h) => {
				let txt = h.textContent.replace(/[▲▼]/g, '').trim();
				h.textContent = txt;
				h.style.color = '';
				h.dataset.originalText = txt;
			});

			const originalText = header.dataset.originalText;
			header.textContent = originalText + (sortState[type] === 'asc' ? ' ▲' : ' ▼');
			header.style.color = '#5055E3';
			header.style.fontWeight = '600';
		});
	});

	function extractValue(item, headerType) {
		switch (headerType) {
			case 'number':
				return parseInt(item.querySelector('.item__inner.item__number')?.textContent.trim() || '0');

			case 'subject':
				return item.querySelector('.item__inner.item__subject')?.textContent.trim() || '';

			case 'rating':
				return parseInt((item.querySelector('.item__extravar .rating').title || '').replace(/[^0-9]/g, '') || '0');

			case 'user':
				return item.querySelector('.item__inner.item__user')?.textContent.trim() || '';

			case 'date':
				return parseInt(item.querySelector('.item__inner.item__number')?.textContent.trim() || '0');

			case 'count':
				return parseInt((item.querySelector('.item__inner.item__count')?.textContent || '').replace(/[^0-9]/g, '') || '0');

			case 'count_star':
				return parseInt((item.querySelector('.item__inner.item_star')?.textContent || '').replace(/[^0-9]/g, '') || '0');

			case 'count_bad':
				return parseInt((item.querySelector('.item__inner.item__count:last-child')?.textContent || '').replace(/[^0-9]/g, '') || '0');

			default:
				return '';
		}
	}

	function sortBoard(headerType, order) {
		const board = document.querySelector('.board__list');
		if (!board) return;

		const items = [...board.querySelectorAll('.item.item-list')].filter((el) => !el.classList.contains('item-list-header'));

		items.sort((a, b) => {
			const va = extractValue(a, headerType);
			const vb = extractValue(b, headerType);

			if (typeof va === 'number') return order === 'asc' ? va - vb : vb - va;
			else return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
		});

		items.forEach((item) => board.appendChild(item));
	}
}

function applySearchByReviewer() {
	if (document.querySelector('ul.gnb a.is-selected')?.href !== 'https://dlm16.net/board_BPPP82') return;

	for (const user of document.querySelectorAll('.item-list > .item__inner.item__user') || []) {
		const textNode = [...user.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
		if (!textNode) continue;

		const username = textNode.textContent.trim();

		const span = document.createElement('span');
		span.className = 'username-clickable';
		span.style.cursor = 'pointer';
		span.textContent = username;

		span.addEventListener('mouseenter', () => {
			span.style.textDecoration = 'underline';
		});

		span.addEventListener('mouseleave', () => {
			span.style.textDecoration = '';
		});

		span.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();

			const form = document.querySelector('#fo_search');
			form.querySelector('select[name=search_target]').value = 'nick_name';
			form.querySelector('input[name=search_keyword]').value = username;
			form.submit();
		});

		user.style.cursor = 'default';
		user.replaceChild(span, textNode);
	}
}

function applyKeydownEvent() {
	document.addEventListener('keydown', function (e) {
		if (e.key.toLowerCase() === 'escape') {
			const btnClose = document.querySelector('.app-dialog-close');
			if (btnClose) return btnClose.click();
		}

		if (e.ctrlKey && e.key.toLowerCase() == 'enter') {
			if (e.target instanceof HTMLTextAreaElement) {
				const form = e.target.closest('form');
				if (form) {
					form.querySelector('.app-button.primary[type=submit]').onclick();
					return procFilter(form, insert_comment);
				}
			}
		}

		if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

		if (e.key.toLowerCase() === 'r') {
			const pathname = location.pathname.match(/^(\/[^\/]+)/)?.[1];
			if (pathname) {
				location.href = location.origin + pathname;
				return;
			}
		}

		if (e.key.toLowerCase() === 'q') {
			const isActiveDialog = document.querySelector('#app-board-search')?.classList.contains('active');
			if (isActiveDialog) return;

			const btnReviewShowMore = document.querySelector('#fo_search a');
			if (btnReviewShowMore?.textContent === '계속 검색') return btnReviewShowMore.click();

			const btnReviewSearch = document.querySelector('[rel="js-board-search-open"]');
			if (btnReviewSearch) {
				e.preventDefault();
				btnReviewSearch.click();
				document.querySelector('[rel="js-board-search"] input[type=text]').focus();
			}

			const btnShowMore = document.querySelector('#app-board-search a');
			if (btnShowMore?.textContent === '계속 검색') return btnShowMore.click();

			const btnSearch = document.querySelector('#board-list a.app-icon-button');
			if (btnSearch) {
				e.preventDefault();
				btnSearch.click();
				document.querySelector('#app-board-search input[type=text]').focus();
			}
		}
	});
}

function applyNotification() {
	if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
		Notification.requestPermission();
	}

	const loadNotifications = async () => {
		const notificationLastLoaded = parseInt(localStorage.getItem('notificationLastLoaded') || '0', 10);
		if (Date.now() - notificationLastLoaded < 30 * 1000) return;

		localStorage.setItem('notificationLastLoaded', Date.now());

		const notificationIDs = JSON.parse(localStorage.getItem('notificationIDs') || '[]');
		const res = await fetch('/index.php?act=dispNcenterliteNotifyList', { credentials: 'include' });
		const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
		const lists = [...doc.querySelectorAll('.app-member-list > li')];

		for (const list of lists) {
			const date = list.querySelector('div > div:nth-child(2) > span:nth-child(1)').innerText;
			const time = list.querySelector('div > div:nth-child(2) > span:nth-child(2)').innerText;
			const datetime = `${date} ${time}`;

			const isUnread = list.querySelector('div > div:nth-child(3) > span').innerText == '읽지 않음';
			if (!isUnread) continue;

			const body = list.querySelector('a').innerText;
			const link = list.querySelector('a').href || null;
			const id = link.match(/(?<=comment_srl=)(?<id>\d+)/)?.groups.id;
			if (!id || notificationIDs.includes(id)) continue;

			localStorage.setItem('notificationIDs', JSON.stringify([id, ...notificationIDs].slice(0, 10)));

			new Notification(datetime, { body: body }).onclick = () => open(link);
		}
	};

	setInterval(loadNotifications, 1000);
}

function applyBoardRefresh() {
	document.head.appendChild(
		Object.assign(document.createElement('style'), {
			textContent: `
				.new-post-highlight {
					animation: newhighlight 0.8s ease-out forwards;
				}

				.updated-post-highlight {
					animation: updatehighlight 0.8s ease-out forwards;
				}

				@keyframes newhighlight {
					0%   { background-color: hsla(58, 84.6%, 62.4%, 0.9); }
					100% { background-color: transparent; }
				}

				@keyframes updatehighlight {
					0%   { background-color: hsla(238, 84.6%, 72.4%, 0.9); }
					100% { background-color: transparent; }
				}
			`,
		}),
	);

	const getPostId = (tr) => parseInt(tr.querySelector('td.title a')?.href.match(/\/(\d+)(?:\?|$)/)?.[1] || '0') || null;
	const getPostSign = (tr) => [tr.querySelector('.title-link')?.textContent.trim(), tr.querySelector('.tw-text-primary')?.textContent.trim()].join('|');
	const highlight = (row, cls) => (row.classList.add(cls), row.addEventListener('animationend', () => row.classList.remove(cls), { once: true }));
	const sync = (doc) => {
		const oldTbody = document.querySelector('table.app-board-template-table tbody');
		const newTbody = doc.querySelector('table.app-board-template-table tbody');
		if (!oldTbody || !newTbody) return;

		const posts = new Map([...oldTbody.querySelectorAll('tr:not(.notice)')].map((r) => [getPostId(r), r]).filter((v) => v[0]));
		const notices = [...oldTbody.querySelectorAll('tr.notice')];

		oldTbody.innerHTML = '';

		notices.forEach((n) => oldTbody.appendChild(n));

		for (const newRow of [...newTbody.querySelectorAll('tr:not(.notice)')]) {
			const postId = getPostId(newRow);
			const oldRow = posts.get(postId);

			if (!oldRow) {
				highlight(newRow, 'new-post-highlight');
			} else if (getPostSign(oldRow) !== getPostSign(newRow)) {
				highlight(newRow, 'updated-post-highlight');
			}

			oldTbody.appendChild(newRow);
		}

		applyBoardStyle();
	};

	const load = async () => {
		if (!document.querySelector('table.app-board-template-table tbody')) return;
		const res = await fetch(location.href, { credentials: 'include' });
		const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

		sync(doc);
	};

	document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && load());
	setInterval(() => document.visibilityState === 'visible' && load(), 10000);
}

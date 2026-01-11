// ==UserScript==
// @name         Dalimernet Assistant
// @version      3.6.4
// @description  달리머넷에 여러가지 기능을 추가하거나 개선합니다.
// @updateURL    https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @downloadURL  https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @match        *://dlm16.net/*
// @run-at       document-end
// ==/UserScript==

const isDarkMode = /color_scheme_dark/i.test(document.body.className);
const isMobile =
	/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches);

(() => {
	'use strict';

	fixPointHistory();
	applyCheckAnonymous();
	applyReviewStyle();
	applyReviewCategory();

	if (isMobile) return;

	applyBoardStyle();
	applyReviewSorting();
	applySearchByReviewer();
	applyKeydownEvent();
	applyNotification();
})();

function fixPointHistory() {
	if (!isDarkMode) return;

	const pointhistory = document.querySelector('table.pointhistory');
	if (!pointhistory) return;

	pointhistory.caption.style.color = '#D4D6E1';

	for (const link of pointhistory.getElementsByTagName('a')) {
		link.style.color = 'hsl(227, 18%, 25%)';
		link.style.textDecoration = 'underline';
	}

	for (const link of document.querySelector('div.pagination-centered').getElementsByTagName('a')) {
		link.style.color = 'hsl(227, 18%,25%)';
	}
}

function applyCheckAnonymous() {
	const checkAnonymous = (inputName) => {
		const inputAnonymous = document.getElementById(inputName);
		if (inputAnonymous) inputAnonymous.checked = true;
	};

	checkAnonymous('is_anonymous');

	const div = document.getElementById('app-board-comment-list');
	if (!div) return;

	const observer = new MutationObserver(() => {
		if (document.getElementById('recomment-write')) checkAnonymous('is_anonymous_re');
	});

	observer.observe(div, { childList: true, subtree: true });
}

function applyReviewStyle() {
	if (location.pathname === '/board_fsDQ08') return;

	const container = document.getElementsByClassName('board__list' + (isMobile ? '-m' : '')).item(0);
	const links = container?.querySelectorAll('a.subject');
	if (!links) return;

	for (let link of links) {
		if (link.dataset.alert !== '열람시 10p가 차감됩니다.') {
			link.style.setProperty('color', '#8488eb', 'important');
		}
	}

	document.addEventListener(
		'click',
		(e) => {
			const a = e.target.closest('.reviewOpen');
			if (!a) return;

			e.preventDefault();
			e.stopImmediatePropagation();
			location.href = a.dataset.link;
		},
		true
	);
}

function applyReviewCategory() {
	if (location.pathname.includes('/board_SjQX31'))
		for (const link of document.querySelectorAll('nav.category-nav > a.dal-btn')) {
			if (link.href == 'https://dlm16.net/board_SjQX31') continue;
			if (link.href == 'https://dlm16.net/board_SjQX31/category/458') continue;
			if (link.href == 'https://dlm16.net/board_SjQX31/category/465') continue;
			if (link.href == 'https://dlm16.net/board_SjQX31/category/466') continue;

			link.remove();
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

function applyBoardStyle() {
	document.querySelectorAll('table.app-board-template-table > tbody > tr').forEach((tr) => {
		const td = tr.querySelector('td.title');
		if (!td) return;

		const a = td.querySelector('a[href]');
		if (!a) return;

		td.style.cursor = 'pointer';
		td.addEventListener('click', (e) => {
			if (e.target.closest('a')) return;
			location.href = a.href;
		});

		const img = tr.querySelector('td.author img');
		if (img?.alt && (img.alt == '여성회원' || img.alt == '여성회원A' || img.alt == '인증회원')) {
			a.style.setProperty('color', '#fcc3db', 'important');
		}
	});
}

function applyReviewSorting() {
	const headerMap = ['number', 'subject', 'rating', 'user', 'date', 'count', 'count_star', 'count_bad'];
	const headerRow = document.querySelector('.item-list-header');
	const headers = headerRow?.querySelectorAll('.item__inner');
	if (!headerRow || !headers) return;

	const sortState = {};

	headers.forEach((header, idx) => {
		const type = headerMap[idx];
		if (!type) return;

		header.dataset.originalText = header.textContent.trim();
		header.style.cursor = 'pointer';

		header.addEventListener('click', () => {
			sortState[type] = sortState[type] === 'asc' ? 'desc' : 'asc';
			sortAllBoards(type, sortState[type]);
			resetHeaders();

			const originalText = header.dataset.originalText;
			header.textContent = originalText + (sortState[type] === 'asc' ? ' ▲' : ' ▼');
			header.style.color = '#5055E3';
			header.style.fontWeight = '600';

			function resetHeaders() {
				headers.forEach((h) => {
					let txt = h.textContent.replace(/[▲▼]/g, '').trim();
					h.textContent = txt;
					h.style.color = '';
					h.dataset.originalText = txt;
				});
			}
		});
	});

	function extractValue(item, headerType) {
		switch (headerType) {
			case 'number':
				return parseInt(item.querySelector('.item__inner.item__number')?.textContent.trim() || '0');

			case 'subject':
				return item.querySelector('.item__inner.item__subject')?.textContent.trim() || '';

			case 'rating':
				return parseInt((item.querySelector('.item__extravar .rating').getAttribute('title') || '').replace(/[^0-9]/g, ''), 10) || 0;

			case 'user':
				return item.querySelector('.item__inner.item__user')?.textContent.trim() || '';

			case 'date':
				return parseInt(item.querySelector('.item__inner.item__number')?.textContent.trim() || '0');

			case 'count':
				return parseInt((item.querySelector('.item__inner.item__count')?.textContent || '').replace(/[^0-9]/g, '')) || 0;

			case 'count_star':
				return parseInt((item.querySelector('.item__inner.item_star')?.textContent || '').replace(/[^0-9]/g, '')) || 0;

			case 'count_bad':
				let list = item.querySelectorAll('.item__inner.item__count');
				let last = list[list.length - 1];

				return parseInt((last?.textContent || '').replace(/[^0-9]/g, '')) || 0;

			default:
				return '';
		}
	}

	function sortBoard(containerSelector, headerType, order) {
		const container = document.querySelector(containerSelector);
		if (!container) return;

		const items = Array.from(container.querySelectorAll('.item.item-list')).filter((el) => !el.classList.contains('item-list-header'));

		items.sort((a, b) => {
			const va = extractValue(a, headerType);
			const vb = extractValue(b, headerType);

			if (typeof va === 'number') return order === 'asc' ? va - vb : vb - va;
			else return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
		});

		items.forEach((item) => container.appendChild(item));
	}

	function sortAllBoards(headerType, order) {
		sortBoard('.board__list', headerType, order);
		sortBoard('.board__list-m', headerType, order);
	}
}

function applySearchByReviewer() {
	const users = document.querySelector('.board__list')?.querySelectorAll('.item-list .item__inner.item__user');
	if (!users) return;

	for (const user of users) {
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

			const form = document.querySelector('[rel="js-board-search"]');
			form.querySelector('select[name=search_target]').value = 'nick_name';
			form.querySelector('input[type=text]').value = username;
			form.querySelector('#fo_search').submit();
		});

		user.replaceChild(span, textNode);

		user.style.cursor = 'default';
	}
}

function applyKeydownEvent() {
	document.addEventListener('keydown', function (e) {
		if (e.key.toLowerCase() === 'escape') {
			const btnClose = document.querySelector('.app-dialog-close');
			if (btnClose) return btnClose.click();
		}

		if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

		if (e.key.toLowerCase() === 'r') {
			const pathname = location.pathname.match(/^(\/[^\/]+)/)?.[1];
			if (pathname) {
				location.href = location.origin + pathname;
				return;
			}
		}

		if (e.key.toLowerCase() !== 'q') return;

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
	});
}

function applyNotification() {
	if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
		Notification.requestPermission();
	}

	const loadNotifications = async () => {
		const notificationIDs = JSON.parse(localStorage.getItem('notificationIDs') || '[]');
		const notificationLastLoaded = parseInt(localStorage.getItem('notificationLastLoaded') || '0', 10);
		if (Date.now() - notificationLastLoaded < 30 * 1000) return;

		localStorage.setItem('notificationLastLoaded', Date.now());

		const res = await fetch('/index.php?act=dispNcenterliteNotifyList', { credentials: 'include' });
		const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
		const items = [...doc.querySelectorAll('.app-member-list > li')];

		for (const li of items) {
			const date = li.querySelector('div > div:nth-child(2) > span:first-child').innerText;
			const time = li.querySelector('div > div:nth-child(2) > span:nth-child(2)').innerText;
			const datetime = `${date} ${time}`;

			const isUnread = li.querySelector('div > div:nth-child(3) > span').innerText == '읽지 않음';
			if (!isUnread) continue;

			const body = li.querySelector('a').innerText;
			const link = li.querySelector('a').href || null;
			const id = link.match(/(?<=comment_srl=)(?<id>\d+)/)?.groups.id;
			if (!id || notificationIDs.includes(id)) continue;

			if (notificationIDs.length > 10) notificationIDs.splice(0, notificationIDs.length - 10);
			localStorage.setItem('notificationIDs', JSON.stringify([...notificationIDs, id]));

			new Notification(datetime, { body: body }).onclick = () => window.open(link);
		}
	};

	setInterval(loadNotifications, 1000);
}

// ==UserScript==
// @name         Dalimernet Assistant
// @version      3.3.1
// @description  달리머넷에 여러가지 기능을 추가하거나 개선합니다.
// @updateURL    https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @downloadURL  https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @match        *://dlm16.net/*
// @run-at       document-end
// ==/UserScript==

(() => {
	'use strict';

	const isMobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
	const chkAnonymous = document.querySelector('input#is_anonymous');
	if (chkAnonymous) chkAnonymous.checked = true;

	applyNotification(isMobile);
	applySortFeature(isMobile);
	applyKeydownEvent(isMobile);
	applyExpandClickArea(isMobile);
	applyRedirectCategory();
	fixPointHistory();
})();

function applyNotification(isMobile) {
	if (isMobile) return;

	if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
		Notification.requestPermission();
	}

	const loadNotifications = async () => {
		setTimeout(loadNotifications, 1000);

		const notificationIDs = JSON.parse(localStorage.getItem('notificationIDs') || '[]');
		const notificationLastLoaded = parseInt(localStorage.getItem('notificationLastLoaded') || '0', 10);
		if (Date.now() - notificationLastLoaded < 30 * 1000) return;

		const res = await fetch('/index.php?act=dispNcenterliteNotifyList', { credentials: 'include' });
		const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
		const items = [...doc.querySelectorAll('.app-member-list > li')];

		localStorage.setItem('notificationLastLoaded', Date.now());

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

			notificationIDs.push(id);
			if (notificationIDs.length > 10) notificationIDs.slice(-1);
			localStorage.setItem('notificationIDs', JSON.stringify(notificationIDs));

			new Notification(datetime, { body: body }).onclick = () => {
				window.focus();
				window.open(link, '_blank');
			};
		}
	};

	loadNotifications();
}
function applySortFeature(isMobile) {
	if (isMobile) return;

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

function applyKeydownEvent(isMobile) {
	if (isMobile) return;

	document.addEventListener('keydown', function (e) {
		if (e.key.toLowerCase() !== 'q') return;
		if (e.target instanceof HTMLInputElement) return;
		if (e.target instanceof HTMLSelectElement) return;

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

function applyExpandClickArea(isMobile) {
	if (isMobile) return;

	document.querySelectorAll('tbody tr').forEach((tr) => {
		const a = tr.querySelector('td a[href]');
		const td = tr.querySelector('td.title');
		if (!a || !td) return;

		td.style.cursor = 'pointer';
		td.addEventListener('click', (e) => {
			if (e.target.tagName.toLowerCase() === 'a') return;
			window.location.href = a.href;
		});
	});
}

function applyRedirectCategory() {
	document.addEventListener('click', function (e) {
		const link = e.target.closest('a');
		if (!link) return;

		const url = new URL(link.href, location.origin);
		if (url.searchParams.size) return;

		switch (url.pathname) {
			case '/board_SjQX31':
				var href = '/category/458';
				break;

			case '/board_coJF70':
				var href = '/category/493';
				break;

			case '/board_bJKb47':
				var href = '/category/510';
				break;
		}

		if (href) {
			e.preventDefault();
			location.href = url.pathname + href;
		}
	});
}

function fixPointHistory() {
	const pointhistory = document.querySelector('.pointhistory');
	if (!pointhistory) return;

	const links = pointhistory.getElementsByTagName('a');
	for (const link of links) {
		link.style.color = 'hsl(227, 18%, 25%)';
		link.style.textDecoration = 'underline';
	}
}

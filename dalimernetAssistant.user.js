// ==UserScript==
// @name         Dalimernet Assistant
// @version      3.1.4
// @description  달리머넷에서 달리머 후기 카테고리 리다이렉트 및 정렬 기능, 'Q' 단축키로 검색/계속검색 클릭 기능이 추가되고 다크모드에서의 포인트 내역 스타일을 개선합니다.
// @updateURL    https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @downloadURL  https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetAssistant.user.js
// @match        *://dlm16.net/*
// @run-at       document-start
// ==/UserScript==

(() => {
	'use strict';

	document.addEventListener('DOMContentLoaded', () => {
		alert('loaded');
		
		addRedirectCategory();
		addSortFunction();
		addKeydownEvent();
		fixPointHistory();
	});
})();

function addRedirectCategory() {
	document.addEventListener('click', function (e) {
		const a = e.target.closest('a');
		if (!a) return;

		const url = new URL(a.href, this.location.origin);
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
			this.location.href = url.pathname + href;
		}
	});
}

function addSortFunction() {
	const headerRow = document.querySelector('.item-list-header');
	if (!headerRow) return;

	const sortState = {};
	const headerMap = ['number', 'subject', 'rating', 'user', 'date', 'count', 'count_star', 'count_bad'];
	const headers = headerRow.querySelectorAll('.item__inner');

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

function addKeydownEvent() {
	document.addEventListener('keydown', function (e) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

		const activeDialog = document.querySelector('.app-dialog')?.classList.contains('active');

		if (e.key.toLowerCase() === 'q' && !activeDialog) {
			const btnShowMoreReview = document.querySelector('#fo_search > a:nth-child(7)');
			if (btnShowMoreReview) return btnShowMoreReview.click();

			const btnShowMore = document.querySelector('#app-board-search > div.app-dialog-container > div > form > div.tw-flex.tw-justify-end > a');
			if (btnShowMore) return btnShowMore.click();

			const btnSearch = document.querySelector('#board-list > div:nth-child(2) > div > a');
			if (btnSearch) {
				e.preventDefault();
				btnSearch.click();
				document.querySelector('.app-input-expand').focus();
			}
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


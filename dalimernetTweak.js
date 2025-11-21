//==UserScript==
//@name         dalimernetTweak
//@version      2.0.1
//@description  dalimernetTweak
//@updateURL    https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetTweak.js
//@downloadURL  https://raw.githubusercontent.com/AesirOrb/Adguard/refs/heads/main/dalimernetTweak.js
//@match        *://dlm16.net/*
//@run-at       document-start
//==/UserScript==

(() => {
	'use strict';

	window.addEventListener('load', function () {
		const pointhistory = document.querySelector('.pointhistory');
		if (pointhistory) {
			const links = pointhistory.getElementsByTagName('a');
			for (const link of links) {
				link.style.color = 'hsl(227, 18%, 25%)';
				link.style.textDecoration = 'underline';
			}
		}

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
	});

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
})();


/* globals utils */

window.diffFileHeader = (() => {
	const diffFile = (() => {
		let lastFile;

		const hasChanged = nextFile => {
			if (nextFile !== lastFile) {
				lastFile = nextFile;
				return true;
			}

			return false;
		};

		const reset = () => {
			lastFile = '';
		};

		return {
			hasChanged,
			reset
		};
	})();

	const maxPixelsAvailable = () => {
		// Unfortunately can't cache this value, as it'll change with the browsers zoom level
		const filenameLeftOffset = $('.diff-toolbar-filename').get(0).getBoundingClientRect().left;
		const diffStatLeftOffset = $('.diff-toolbar-filename + .float-right').get(0).getBoundingClientRect().left;

		return diffStatLeftOffset - filenameLeftOffset;
	};

	const parseFileDetails = filename => {
		const folderCount = (filename.match(/\//g) || []).length;
		const [, basename] = (filename.match(/(?:\/)([\w\.-]+)$/) || []);
		const [, topDir] = (filename.match(/^([\w\.-]+)\//) || []);

		return {
			folderCount,
			basename,
			topDir
		};
	};

	const updateFileLabel = val => {
		const $target = $('.diff-toolbar-filename');
		$target.addClass('filename-width-check').text(val);

		const maxPixels = maxPixelsAvailable();
		const doesOverflow = () => $target.get(0).getBoundingClientRect().width > maxPixels;
		const {basename, topDir, folderCount} = parseFileDetails(val);

		if (doesOverflow() && folderCount > 1) {
			$target.text(`${topDir}/.../${basename}`);
		}

		if (doesOverflow()) {
			$target.text(basename);
		}

		$target.removeClass('filename-width-check');
	};

	const getDiffToolbarHeight = () => {
		const el = $('.pr-toolbar.is-stuck').get(0);
		return (el && el.clientHeight) || 0;
	};

	const isFilePartlyVisible = (fileEl, offset) => {
		const {bottom} = fileEl.getBoundingClientRect();
		return bottom >= offset;
	};

	const getHighestVisibleDiffFilename = () => {
		const toolbarHeight = getDiffToolbarHeight();
		if (!toolbarHeight) {
			return;
		}

		const files = Array.from($('.file.js-details-container'));
		return files.find(el => isFilePartlyVisible(el, toolbarHeight));
	};

	const diffHeaderFilename = isResize => {
		const targetDiffFile = getHighestVisibleDiffFilename();
		if (!targetDiffFile) {
			return;
		}

		const filename = $(targetDiffFile).find('.file-header').attr('data-path');

		if (!diffFile.hasChanged(filename) && !isResize) {
			return;
		}

		if (isResize) {
			const target = $('.diff-toolbar-filename').get(0);
			if (target.getBoundingClientRect().width < maxPixelsAvailable()) {
				return;
			}
		}

		updateFileLabel(filename);
	};

	const setup = () => {
		$(window).on('scroll.diffheader', () => diffHeaderFilename());
		const onResize = utils.debounce(() => diffHeaderFilename(true), 200);
		$(window).on('resize.diffheader', onResize);

		$(`<span class="diff-toolbar-filename"></span>`).insertAfter($('.toc-select'));
		diffFile.reset();
	};

	const destroy = () => {
		$(window).off('scroll.diffheader');
		$(window).off('resize.diffheader');
		$('.diff-toolbar-filename').remove();
	};

	return {
		setup,
		destroy
	};
})();

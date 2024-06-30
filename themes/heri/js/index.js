const LS_SETTINGS_DARKMODE = 'darkMode';

// Navigation
(() => {
    const testInBrowser = () => {
        const links = document.head.querySelectorAll('[data-nw-nav="active"]');
        links.forEach(el => console.log(el.getAttribute('href')));
    };
    const initNav = () => {
        const $nav = document.getElementById('mainNav');
        const $act = document.querySelectorAll('[data-nw-nav="active"]');
        const $base = document.head.querySelector('base');
        $act.forEach(a => {
            const shortLink = `${a.getAttribute('href').substring($base.getAttribute('href').length)}`;
            const $link = $nav.querySelector(`[href="${a.getAttribute('href')}"], [href="${shortLink}"]`);
            if ($link) $link.classList.add('active');
        });
        $nav.querySelectorAll('.nav-link.active').forEach($active => {
            let $current = $active.parentElement;
            while ($current && $current !== $nav) {
                if ($current.tagName === 'LI') {
                    const $a = $current.querySelector('a');
                    if ($a) $a.classList.add('active');
                }
                $current = $current.parentElement;
            }
        });
    };

    document.addEventListener("DOMContentLoaded", initNav);
})();

// Filter by date
(() => {
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    if (date) {
        const hidden = document.querySelectorAll(`[data-date]:not([data-date^="${date}"])`);
        hidden.forEach(el => el.closest('[data-id]').classList.add('d-none'));
    }
})();

// Gallery popup slider
(() => {

    function onImgClick(event) {

    }

    function galleryPopup () {
        const $galleries = document.querySelectorAll('section.gallery');
        $galleries.forEach($gallery => {
            $gallery.querySelectorAll('figure img').forEach($img => {

                $img.addEventListener('click', onImgClick);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', galleryPopup);
})();

// Search API
(() => {
    window.searchTextValue = null;
    window.searchResults = [];
    window.search = async function (str) {
        if ('string' === typeof str && str.length < 2) return [];
        if (window.searchTextValue === str) return window.searchResults;
        window.searchTextValue = str;
        const checkpoint = Date.now();
        const tokens = str.toLowerCase().split(/\s+/);
        const searchResponse = await fetch('/search.json', { cache: 'reload' });
        const searchData = await searchResponse.json();
        const version = searchData.version || '';
        const response = await fetch(`/search.txt?ver=${version}`, {
            method: 'GET',
            headers: { 'Accept-Encoding': 'gzip, deflate, br' }
        });
        const contentEncoding = response.headers.get('Content-Encoding');
        const size = response.headers.get('Content-Length');
        const time = Date.now() - checkpoint;
        const msg = `search.txt: ${(time / 1000).toFixed(2)}sec | ${(size / 1024).toFixed(1)}Kb | ${version.slice(0, 4)}..${version.slice(-4)}`;
        if (contentEncoding && contentEncoding.includes('gzip')) {
            console.log(msg);
        } else {
            console.error(msg);
        }
        const text = await response.text();

        // Split the text into lines and group every 4 lines into one entry
        const lines = text.trim().split('\n\n').map(entry => entry.split('\n'));

        // Function to calculate the score based on tokens and distances
        const calculateScore = (tokens, text) => {
            const lowerText = text.toLowerCase();
            let score = 0;
            let lastIndex = -1;

            tokens.forEach(token => {
                const index = lowerText.indexOf(token);
                if (index !== -1) {
                    if (!score) score = 1;
                    score += token.length;
                    if (lastIndex !== -1) {
                        score += token.length * (index - lastIndex);
                    }
                    lastIndex = index;
                }
            });

            return score;
        };

        // Search and rank each entry
        const results = lines.map(([uri, title, desc, image, body], i) => {
            desc = JSON.parse(desc);
            body = JSON.parse(body);
            const fullText = title + " " + desc + " " + body;
            const score = calculateScore(tokens, fullText);
            return {
                uri: JSON.parse(uri),
                title: JSON.parse(title),
                desc,
                image: JSON.parse(image),
                body,
                score
            };
        }).filter(result => result.score > 0); // Filter out entries with no matches

        // Sort the results by score in descending order
        results.sort((a, b) => b.score - a.score);

        return results;
    };

    const $input = document.getElementById('searchInput');
    const $results = document.getElementById('searchResults');
    const $template = document.getElementById('searchResultTemplate');
    if (!$input || !$results || !$template) return;

    // Handle Tab navigation within results
    $results.addEventListener('keydown', function (e) {
        const focusableElements = Array.from($results.children);
        const focusedElement = document.activeElement;
        if (!focusableElements.includes(focusedElement)) return;

        if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent the default Tab behavior

            const focusableElements = Array.from($results.children);
            const focusedElement = document.activeElement;
            const currentIndex = focusableElements.indexOf(focusedElement);

            let nextIndex = 0;
            if (e.key === 'Tab' || e.key === 'ArrowDown') {
                nextIndex = currentIndex + 1 < focusableElements.length ? currentIndex + 1 : 0;
            } else if (e.key === 'ArrowUp' || e.key === 'Tab' && e.shiftKey) {
                nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : focusableElements.length - 1;
            }

            focusableElements[nextIndex].focus();
        }
        if (e.key === 'Enter') {
            const link = focusedElement.querySelector('[data-url]');
            if (link) link.click();
        }
    });
    $input.addEventListener('keyup', function () {
        $results.innerHTML = '';
        window.search($input.value).then(results => {
            window.searchResults = results;
            results.forEach(r => {
                const $row = $template.content.cloneNode(true);
                const $img = $row.querySelectorAll('[data-img]');
                if ($img.length) $img.forEach(i => i.setAttribute('src', r.image));
                const $title = $row.querySelectorAll('[data-title]');
                if ($title.length) $title.forEach(t => t.textContent = r.title);
                const $desc = $row.querySelectorAll('[data-desc]');
                if ($desc.length) $desc.forEach(t => t.textContent = r.desc);
                const $a = $row.querySelectorAll('[data-url]');
                if ($a) $a.forEach(a => a.setAttribute('href', r.uri));
                $results.appendChild($row);
                const newRow = $results.lastElementChild;
                newRow.setAttribute('tabindex', '0');
                newRow.setAttribute('role', 'button');
            });
        });
    });

    const $modal = document.getElementById('searchModal');
    $modal.addEventListener('shown.bs.modal', () => $input.focus());
})();

// Hotkeys
(() => {
    const hotkeySearch = (event) => {
        // Check if either CMD (Mac) or CTRL (Windows/Linux) is pressed along with K
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault(); // Prevent any default actions

            // Your button action here, for example, clicking a button with the ID 'myButton'
            const button = document.querySelector('[data-bs-target="#searchModal"]');
            if (button) {
                button.click();
            }
        }
    };
    document.addEventListener('keydown', hotkeySearch);
})();

// Dark mode
(() => {
    const enableDarkMode = (mode) => {
        localStorage.setItem(LS_SETTINGS_DARKMODE, mode);
        document.dispatchEvent(new Event('darkModeChange'));
    
        const isDark = null === mode ? window.matchMedia('(prefers-color-scheme: dark)').matches : parseInt(mode);
        document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    };
    const detectDarkMode = () => {
        let darkMode = localStorage.getItem(LS_SETTINGS_DARKMODE) || null;
        if (null === darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            darkMode = 1;
        }
        return parseInt(darkMode);
    };
    const hotkeyDarkMode = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'd' || event.key === 'D')) {
            event.preventDefault();
            const darkMode = 1 - detectDarkMode();
            enableDarkMode(darkMode);
        }
    };
    const handleDarkMode = () => {
        const $switch = document.getElementById('settingsDarkMode');
        if (!$switch) return;
        $switch.checked = 1 === detectDarkMode();
        enableDarkMode($switch.checked ? 1 : 0);
        $switch.addEventListener('change', e => { enableDarkMode(e.currentTarget.checked ? 1 : 0); });
        document.addEventListener('darkModeChange', () => $switch.checked = 1 === detectDarkMode());
    };
    document.addEventListener('DOMContentLoaded', handleDarkMode);
    document.addEventListener('keydown', hotkeyDarkMode);
})();

function openGalleryModal(index) {
    const $modal = document.getElementById('galleryModal');
    const myModal = new bootstrap.Modal($modal);

    $modal.addEventListener('shown.bs.modal', function() {
        const $active = $modal.querySelector('.carousel-control-next');
        if (!$active) $active.focus();
    });

    myModal.show();
    
    // Initialize the carousel in modal and go to the clicked slide index
    var myCarousel = document.querySelector('#galleryCarousel');
    var carousel = new bootstrap.Carousel(myCarousel);
    carousel.to(index); // Go to the slide index of clicked image
}
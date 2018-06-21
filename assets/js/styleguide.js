(function() {
    function renderSectionNavigation() {
        var patternTitleEls = document.querySelectorAll('.js-sg-pattern-title');
        var patternTitles = [].map.call(patternTitleEls, function(el) {
            return {
                label: el.textContent,
                id: el.id
            };
        });

        var markup = `
            <form class="sg-jump-nav" action="" method="get">
                <label for="sg-section-switcher" class="sg-visuallyhidden">
                    Jump to section:
                </label>
                <select id="sg-section-switcher" name="sg-section-switcher">
                    <option value="" selected>Jump to&hellip;</option>
                    <optgroup label="Sections">
                        ${patternTitles
                            .map(title => {
                                return `<option value="#${title.id}">
                                ${title.label}
                            </option>`;
                            })
                            .join('\n')}
                    </optgroup>
                </select>
                <button type="submit" class="sg-visuallyhidden">Go</button>
            </form>`;

        var div = document.createElement('div');
        div.className = 'sg-toolbar';
        div.innerHTML = markup;

        var bodyEl = document.querySelector('body');
        bodyEl.appendChild(div);
    }

    function initSectionNavigation() {
        var select = document.getElementById('sg-section-switcher');
        if (select) {
            select.addEventListener('change', function() {
                var val = this.value;
                if (val) {
                    window.location = val;
                }
            });
        }
    }

    renderSectionNavigation();
    initSectionNavigation();
})();

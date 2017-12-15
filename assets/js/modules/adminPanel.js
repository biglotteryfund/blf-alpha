const $ = require('jquery');

function init() {
    if (window.AppConfig.adminEndpoint) {
        $.ajax({
            url: window.AppConfig.adminEndpoint,
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        })
            .then(response => response.data.attributes)
            .then(attributes => {
                var div = document.createElement('div');
                div.className = 'admin-panel';
                div.innerHTML = `<ul class="admin-panel__list">
                    <li class="admin-panel__item">
                        <a class="admin-panel__link" href="${attributes.editUrl}">Edit Page</a>
                    </li>
                </ul>`;
                var bodyEl = document.querySelector('body');
                bodyEl.appendChild(div);
            })
            .catch(function() {});
    }
}

module.exports = {
    init
};

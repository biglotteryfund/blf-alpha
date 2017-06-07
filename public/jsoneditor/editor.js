let editors = {};

fetch(window.location, { method: 'post' }).then((r) => r.json()).then((data) => {
    data.editors.forEach(editor => {
        let element = document.getElementById(`js-locale-${editor.code}`);
        let title = document.getElementById(`js-title-${editor.code}`);
        title.innerText = editor.name;
        editors[editor.code] = new JSONEditor(element, {
            schema: editor.schema,
            startval: editor.json,
            disable_edit_json: true,
            disable_properties: true,
            theme: 'bootstrap3'
        });
    });

    let makeWysiwyg = (elm) => {
        if (!elm.data('is-editor')) {
            elm.height(200);
            elm.data('is-editor', true);
            elm.sceditor({
                plugins: 'xhtml',
                toolbar: "bold,italic,underline|source",
                emoticonsEnabled: false,
                style: '/assets/sceditor/jquery.sceditor.default.min.css'
            });
        }
    }

    let isHTML = (str) => {
        return /^<.*?>$/.test(str) && !!$(str)[0];
    }

    $('.form-control').on('focus', function (e) {
        let val = $(this).val();
        if (isHTML(val)) {
            makeWysiwyg($(this));
        }
    });

    $('#js-get-json').on('click', function (e) {
        console.log(editors.en.getValue());
        console.log(editors.cy.getValue());
    });

});
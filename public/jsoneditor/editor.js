let editors = {};

fetch('/status/locales', { method: 'post' }).then((r) => r.json()).then((data) => {
    data.editors.forEach(editor => {
        let element = document.getElementById(`js-locale-${editor.code}`);
        let title = document.getElementById(`js-title-${editor.code}`);
        title.innerText = editor.name;
        editors[editor.code] = new JSONEditor(element, {
            schema: editor.schema,
            startval: editor.json,
            disable_edit_json: true,
            disable_properties: true,
            required_by_default: true,
            theme: 'bootstrap3'
        });
    });

    let makeWysiwyg = (elm, path, locale) => {

        path = path.replace(/\[/g, '.').replace(/\]/g, '')
        var editorElm = editors[locale].getEditor(path);

        if (!elm.data('is-editor')) {
            elm.height(200);
            elm.data('is-editor', true);
            elm.sceditor({
                plugins: 'xhtml',
                toolbar: "bold,italic,underline,bulletlist,orderedlist,quote|email,link,unlink|maximize,source",
                emoticonsEnabled: false,
                style: '/assets/sceditor/jquery.sceditor.default.min.css'
            });

            let updateOriginal = () => {
                if (editorElm) {
                    editorElm.setValue(elm.sceditor('instance').getWysiwygEditorValue());
                }
            }

            // update original form field when it changes
            elm.sceditor('instance').nodeChanged(updateOriginal);
            elm.sceditor('instance').keyPress(updateOriginal);
        }
    }

    let isHTML = (str) => {
        return /^<.*?>$/.test(str) && !!$(str)[0];
    }

    $('.form-control').on('focus', function (e) {
        let locale = $(this).parents('.js-locale-id').data('locale');
        let val = $(this).val();
        let path = $(this).attr('name')
        if (isHTML(val)) {
            makeWysiwyg($(this), path, locale);
        }
    });

    $('#js-get-json').on('click', function (e) {
        let data = {
            en: editors.en.getValue(),
            cy: editors.cy.getValue()
        };

        $.post({
            url: '/status/locales/update',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (status) {
                if (status.error) {
                    alert('There was an error saving the following languages: ' + status.error)
                } else {
                    alert('Languages successfully updated!');
                }
            }
        });

    });

});
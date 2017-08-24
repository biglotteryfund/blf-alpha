let editors = {};

fetch('/tools/locales', { method: 'post',  credentials: 'same-origin' }).then((r) => r.json()).then((data) => {
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

    // convert a form input into a textarea
    let makeTextarea = (elm) => {
        let style = elm.attr('style');
        let textbox = $(document.createElement('textarea')).attr({
            id: elm.id,
            name: elm.name,
            rows: 20
        }).width(elm.width()).css({
            backgroundColor: '#ffffff',
            padding: '20px',
            minHeight: '300px'
        });
        let oldVal = elm.val();
        elm.replaceWith(textbox);
        textbox.val(oldVal);
        return textbox;
    };

    // turn a textarea into an editable, wysiwyg tool
    let makeWysiwyg = (elm, path, locale) => {

        // grab the json editor element
        path = path.replace(/\[/g, '.').replace(/\]/g, '')
        let editorElm = editors[locale].getEditor(path);

        // only init the wysiwyg editor once
        if (!elm.data('is-editor')) {

            elm.data('is-editor', true);
            elm = makeTextarea(elm);

            let triggerClass = 'js-next-editor';
            elm.addClass(triggerClass)

            // we can't initialise the wysiwyg editor with an element,
            // it has to be a selector
            let editor = new MediumEditor(`.${triggerClass}`, {
                paste: {
                    forcePlainText: false,
                    cleanPastedHTML: true,
                    cleanTags: ['o:p'], // MS word magic tags
                    // replacing the entire tag (eg <div> => <p>) doesn't work
                    // possibly to do with inline styles?
                    cleanReplacements: [
                        [/<div/gi, '<p'],
                        [/<\/div>/ig, '']
                    ]
                },
                toolbar: {
                    buttons: ['bold', 'italic', 'quote', 'anchor', 'orderedlist', 'unorderedlist', 'removeFormat'],
                }
            });

            // remove this now we've initialised the wysiwyg editor
            // so we don't re-init next time
            elm.removeClass(triggerClass);

            // pass the wysiwyg HTML value back to the json editor
            let updateOriginal = () => {
                if (editorElm) {
                    editorElm.setValue(elm.val());
                }
            }

            // when input changes, update original
            editor.subscribe('editableInput', updateOriginal);
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

    $('#js-save-changes').on('click', function (e) {
        let data = {
            en: editors.en.getValue(),
            cy: editors.cy.getValue()
        };

        $.post({
            url: '/tools/locales/update',
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
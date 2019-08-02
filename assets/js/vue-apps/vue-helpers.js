import VueI18n from 'vue-i18n';

export function setupI18n(vueInstance, localeOverride = null) {
    vueInstance.use(VueI18n);

    return new VueI18n({
        locale: localeOverride || window.AppConfig.locale,
        fallbackLocale: 'en',
        messages: require('./locales.json')
    });
}

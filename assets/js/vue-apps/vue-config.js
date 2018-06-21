export const VueConfig = {
    delimiters: ['<%', '%>']
};

export function withDefaults(config) {
    return Object.assign({}, VueConfig, config);
}

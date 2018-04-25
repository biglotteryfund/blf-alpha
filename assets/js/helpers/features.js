import find from 'lodash/find';

function createFeature(config) {
    let override = null;
    try {
        override = window.localStorage.getItem(`app.features.${config.id}`);
    } catch (e) {} // eslint-disable-line no-empty

    const isEnabled = override !== null ? override === 'true' : config.isEnabled;

    return {
        id: config.id,
        description: config.description,
        isEnabled: isEnabled
    };
}

export const isDoNotTrack =
    window.doNotTrack === '1' || window.navigator.doNotTrack === '1' || window.navigator.msDoNotTrack === '1';

export const FEATURES = [
    createFeature({
        id: 'analytics',
        description: 'Enable Google Analytics',
        isEnabled: !window.AppConfig.blockAnalytics && !isDoNotTrack
    }),
    createFeature({
        id: 'hotjar',
        description: 'Enable HotJar',
        isEnabled: !isDoNotTrack
    }),
    createFeature({
        id: 'review-abandonment-message',
        description: 'Show abandonment message on the review step',
        isEnabled: true
    })
];

window.AppConfig.features = FEATURES;

export function featureIsEnabled(featureId) {
    const match = find(FEATURES, feature => feature.id === featureId);
    if (match) {
        return match.isEnabled;
    } else {
        throw new Error(`Feature ${featureId} not found`);
    }
}

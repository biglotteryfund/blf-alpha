/**
 * storageAvailable
 * @link  https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
 * @param {string} type
 */
export function storageAvailable(type) {
    let storage;
    try {
        storage = window[type];
        let x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            (e.code === 22 ||
                e.code === 1014 ||
                e.name === 'QuotaExceededError' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            storage.length !== 0
        );
    }
}

// Based on https://gist.github.com/anhang/1096149
export function setWithExpiry({ type, key, data, expiryInMinutes }) {
    if (!storageAvailable(type)) {
        return;
    }
    const expirationMs = expiryInMinutes * 60 * 1000;
    const record = {
        value: JSON.stringify(data),
        timestamp: new Date().getTime() + expirationMs
    };
    window[type].setItem(key, JSON.stringify(record));
    return data;
}

export function getWithExpiry({ type, key }) {
    if (!storageAvailable(type) || !window[type].getItem(key)) {
        return;
    }
    const record = JSON.parse(window[type].getItem(key));
    if (!record) {
        return false;
    }
    const hasExpired = new Date().getTime() > record.timestamp;
    if (hasExpired) {
        window[type].removeItem(key);
        return;
    }
    return JSON.parse(record.value);
}

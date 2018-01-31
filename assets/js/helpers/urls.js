function isDownloadLink(href) {
    const documentRegex = /\.(pdf|doc|docx|xls|xlsx)$/i;
    return documentRegex.test(href);
}

function isExternalLink(linkEl) {
    return !(location.hostname === linkEl.hostname || !linkEl.hostname.length);
}

module.exports = {
    isDownloadLink,
    isExternalLink
};

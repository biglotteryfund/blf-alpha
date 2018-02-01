function isDownloadLink(href) {
    const documentRegex = /\.(pdf|doc|docx|xls|xlsx)$/i;
    return documentRegex.test(href);
}

function isExternalLink(currentHostname, linkHostname) {
    return !(currentHostname === linkHostname || !linkHostname.length);
}

module.exports = {
    isDownloadLink,
    isExternalLink
};

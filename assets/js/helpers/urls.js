function isDownloadLink(href) {
    const documentRegex = /\.(pdf|doc|docx)$/i;
    return documentRegex.test(href);
}

module.exports = {
    isDownloadLink
};

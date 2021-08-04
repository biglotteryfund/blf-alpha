import $ from 'jquery';

function changeIframeToLink() {
    // Find all iframes with an src of youtube, split out the link, take the video ID and create a link.
    $("iframe[src*='youtube']").each(function() {
        let link = 'http://www.youtube.com/watch?v=' + $(this).attr('src').split('/')[4];
        $(this).parent().append('<a href="' + link + '">' + link + '</a>').css('padding-top', '0%'); // Add the link to the parent and
        $(this).remove();
    });
}

function init() {
    // If the user has only selected to have essential cookies, turn all iframe YouTube videos to links.
    if(localStorage.getItem('tnlcommunityfund:cookie-consent') != 'all') {
        changeIframeToLink();
    }
}

export default {
    init,
};

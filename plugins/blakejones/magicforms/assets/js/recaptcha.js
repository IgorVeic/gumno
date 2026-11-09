var captchas = [];

var onloadCallback = function() {
    var nodes = document.querySelectorAll('.g-recaptcha');
    Array.prototype.forEach.call(nodes, function(el) {
        if (el.querySelector('iframe') || el.getAttribute('data-widget-id') !== null) {
            return;
        }
        var params = {
            sitekey: el.getAttribute('data-sitekey'),
            theme: el.getAttribute('data-theme') || 'light',
            type: el.getAttribute('data-type') || 'image',
            size: el.getAttribute('data-size') || 'normal'
        };
        var id = grecaptcha.render(el, params);
        el.setAttribute('data-widget-id', String(id));
        captchas[el.id] = id;
    });
};

function resetReCaptcha(id) {
    var widget = captchas[id];
    if (typeof widget !== 'undefined') {
        grecaptcha.reset(widget);
    }
}
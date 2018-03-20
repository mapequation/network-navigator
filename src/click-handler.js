let clickTimeout;

export function doubleClickHandler(callback) {
    return function(n) {
        clearTimeout(clickTimeout);
        callback.call(this, n);
    }
}

export function clickHandler(callback, clickDelay = 200) {
    return function(n) {
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => callback.call(this, n), clickDelay);
    }
}

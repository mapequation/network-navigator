// https://stackoverflow.com/a/7317311/3690629
export default function (message) {
    window.addEventListener('beforeunload', function (e) {
        (e || window.event).returnValue = message;
        return message;
    });
}

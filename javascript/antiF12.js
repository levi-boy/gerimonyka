window.onload = function () {
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);


    window.addEventListener("keydown", function(event) {
        if (event.keyCode == 116) {
            // block F5 (Refresh)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (event.keyCode == 122) {
            // block F11 (Fullscreen)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (event.keyCode == 123) {
            // block F12 (DevTools)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (event.ctrlKey && event.shiftKey && event.keyCode == 73) {
            // block Strg+Shift+I (DevTools)
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        else if (event.ctrlKey && event.shiftKey && event.keyCode == 74) {
            // block Strg+Shift+J (Console)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
            // block Strg+Shift+J (Console)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
            // block Strg+Shift+J (Console)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            // block Strg+Shift+J (Console)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (e.ctrlKey && e.keyCode == 85) {
            // block Strg+Shift+J (Console)
            event.preventDefault();
            event.stopPropagation();
            return false;

        } else if (e.ctrlKey && e.keyCode == 85) {
            // block Strg+Shift+J (Console)
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    });
}

# WebExtension-ContentScriptsLoader

Manages the insertion of content scripts to all matching tabs. This is useful so that after your extension is installed, it's available to be used in all available tabs right away. It essentially replicates a tab-reload without actually reloading it.

It's important to note that you need the 'tabs' permission in order to query all the tabs and finding the appropriate ones for "content_scripts" blocks.

All you need to do is call the insert method, and it will take care of iterating all tabs, and whichever ones match any of your "content_scripts" blocks (defined in your manifest), inserting the appropriate css and/or js.

It will also take into consideration the "run_at" value, to ensure they're inserted as you designated in your manifest.

## Sample Usage:
``` javascript
chrome.runtime.onInstalled.addListener(
    function(details) {
        if (details.reason === 'install') {
            ContentScriptsLoader.insert().then(function() {
                alert('Extension code available in all tabs');
            });
        }
    }
);
```


/**
 * ContentScriptsLoader
 * 
 * Manages the insertion of content scripts to all matching tabs. This is useful
 * so that after your extension is installed, it's available to be used in all
 * available tabs right away. It essentially replicates a tab-reload without
 * actually reloading it.
 * 
 * It's important to note that you need the 'tabs' permission in order to query
 * all the tabs and finding the appropriate ones for "content_scripts" blocks.
 * 
 * All you need to do is call the insert method, and it will take care of
 * iterating all tabs, and whichever ones match any of your "content_scripts"
 * blocks (defined in your manifest), inserting the appropriate css and/or js.
 * 
 * It will also take into consideration the "run_at" value, to ensure they're
 * inserted as you designated in your manifest.
 * 
 * @example
 * chrome.runtime.onInstalled.addListener(
 *     function(details) {
 *         if (details.reason === 'install') {
 *             ContentScriptsLoader.insert().then(function() {
 *                 alert('Extension code available in all tabs');
 *             });
 *         }
 *     }
 * );
 * @abstract
 */
window.ContentScriptsLoader = (function() {

    /**
     * __cloneArray
     * 
     * @access  private
     * @param   Array arr
     * @return  Array
     */
    var __cloneArray = function(arr) {
        return arr.slice(0);
    };

    /**
     * __getManifest
     * 
     * @access  public
     * @return  Object
     */
    var __getManifest = function() {
        return chrome.runtime.getManifest();
    };

    /**
     * __loadContentScripts
     * 
     * @access  private
     * @return  Promise
     */
    var __loadContentScripts = function() {
        return new Promise(function(resolve, reject) {
            var manifest = __getManifest(),
                contentScripts = manifest.content_scripts;
            if (contentScripts.length === 0) {
                resolve();
            } else {
                __loadContentScriptsRecursively(contentScripts).then(resolve);
            }
        });
    };

    /**
     * __loadContentScriptsRecursively
     * 
     * @access  private
     * @param   Array contentScripts
     * @return  Promise
     */
    var __loadContentScriptsRecursively = function(contentScripts) {
        return new Promise(function(resolve, reject) {
            if (contentScripts.length === 0) {
                resolve();
            } else {
                var contentScript = contentScripts.shift(),
                    scripts = [],
                    runAt = contentScript.run_at;
                for (var index in contentScript.css) {
                    scripts.push({
                        'type': 'css',
                        'value': contentScript.css[index]
                    });
                }
                for (index in contentScript.js) {
                    scripts.push({
                        'type': 'js',
                        'value': contentScript.js[index]
                    });
                }
                chrome.tabs.query(
                    {
                        url: contentScript.matches
                    },
                    function(tabs) {
                        __loadTabsRecursively(tabs, scripts, runAt).then(
                            function() {
                                __loadContentScriptsRecursively(contentScripts).then(
                                    resolve
                                )
                            }
                        );
                    }
                );
            }
        });
    };

    /**
     * __loadScriptsRecursively
     * 
     * @access  private
     * @param   Array scripts
     * @param   Object tab
     * @param   String runAt
     * @return  Promise
     */
    var __loadScriptsRecursively = function(scripts, tab, runAt) {
        return new Promise(function(resolve, reject) {
            if (scripts.length === 0) {
                resolve();
            } else {
                if (tab.url.match(/^chrome\:\//i) === null) {
                    var script = scripts.shift(),
                        closure = chrome.tabs.executeScript;
                    if (script.type === 'css') {
                        closure = chrome.tabs.insertCSS;
                    }
                    closure(tab.id, {
                        file: script.value,
                        runAt: runAt
                    }, function() {
                        __loadScriptsRecursively(scripts, tab, runAt).then(
                            resolve
                        );
                    });
                } else {
                    resolve();
                }
            }
        });
    };

    /**
     * __loadTabsRecursively
     * 
     * @access  private
     * @param   Array tabs
     * @param   Array scripts
     * @param   String runAt
     * @return  Promise
     */
    var __loadTabsRecursively = function(tabs, scripts, runAt) {
        return new Promise(function(resolve, reject) {
            if (tabs.length === 0) {
                resolve();
            } else {
                var tab = tabs.shift(),
                    clonedScripts = __cloneArray(scripts);
                __loadScriptsRecursively(clonedScripts, tab, runAt).then(
                    function() {
                        __loadTabsRecursively(tabs, scripts, runAt).then(resolve);
                    }
                );
            }
        });
    };

    // Public
    return {

        /**
         * insert
         * 
         * @access  public
         * @return  Promise
         */
        insert: function () {
            return __loadContentScripts();
        }
    };
})();

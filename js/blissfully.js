(function(window, document, undefined) {


  window.Blissfully = (function() {
    // chrome.storage.sync.clear();
    
    // Default config parameters
    var DEFAULT_CONFIG = {
      words: [],
      blockCount: 0,
    };
    var CONFIG = DEFAULT_CONFIG;




    /**
     * Saves an object to a storage key
     * 
     * @param {String} storageKey - name of place to store data
     * @param {String} json - a JSON string being saved
     */
    function setChromeStorage(storageKey, obj) {
      // Initialize an object to store
      var storageObj = {};
      storageObj[storageKey] = obj;
      
      // Save object to chrome storage
      chrome.storage.sync.set(storageObj, function() {
        CONFIG = obj;
      });
    }
    


    /**
     * Returns a storage key's value
     * 
     * @param {String} storageKey - name of place to store data
     * @param {Object} config - object to save chrome data to.
     */
    function getChromeStorage(storageKey) {
      chrome.storage.sync.get(storageKey, function(data) {
        CONFIG = data[storageKey];
      });
    }



    /**
     * Function that completely loads and configures storage
     *
     * @param {String} storageKey - name of chrome data object
     * @param {String} config - JSON string of current config
     */
    function loadStorage(storageKey, callback) {
      // Get object (based on key) from Chrome storage
      chrome.storage.sync.get(storageKey, function(data) {
        if (data[storageKey] === undefined) {
          setChromeStorage(storageKey, CONFIG);
        } else {
          CONFIG = data[storageKey];
        }

        callback();
      });
    }



    /**
     * Creates a MutationObserver instance that will detect
     * anytime an element is added (or removed) from the DOM
     * - Only will searchDOM on the homePage though.
     */
    function trackDOMChanges() {
      // create an observer instance
      this.observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (window.location.pathname == '/') {
            // console.log('We are on the home page!!!')
            var nodeList = mutation.addedNodes;
            // Make sure nodes were added and they are elements
            if (nodeList.length && nodeList[0].nodeType === 1) {
              searchDOM(nodeList[0], filterDivs);
            }
          }
        });
      });
      this.isActive = false;
      // configuration of the observer:
      this.observerConfig = { attributes: true, childList: true, 
                             subtree: true, characterData: true };
      // pass in the target node, as well as the observer options
    }


    /**
     * Calls the Mutation Object's .observe() method, and
     * marks the observer as active
     */
    trackDOMChanges.prototype.observe = function() {
      this.isActive = true;
      this.observer.observe(document, this.observerConfig);
    }


    /**
     * Calls the Mutation Object's .disconnect() method, and
     * marks the observer as inactive
     */
    trackDOMChanges.prototype.disconnect = function() {
      this.isActive = false;
      this.observer.disconnect();
    }


    /**
     * Checks to see what page user is on by logging
     * current URL. Disconnects the observer if 
     * not on homepage and reconnects if on homepage
     */
     trackDOMChanges.prototype.validateInstance = function() {
        var _this = this;
        setInterval(function() {
          var homePage = window.location.pathname === '/';
          // console.log('Is Homepage: ', homePage);
          // Disconnect observer if user not on homepage
          if (!homePage) {
            if (_this.isActive) {
              // console.log("I'm disconnecting the observer");  
              _this.disconnect();
            }
          }
          // Observe the DOM if user is on homepage
          if (homePage) {
            if (!_this.isActive) {
              // console.log("I'm going to observe again.");
              _this.observe();
            }
          }
        }, 250);
     }



    /**
     * Search DOM for elements that might be user posts and executes callback 
     * (callback will apply filter for each element)
     *
     * @param {Object} nodeList - Added nodes to be searched
     * @param {Callback} callback - Function to execute upon DOM search
     */
    function searchDOM(nodeList, callback) {
      var configObj = CONFIG;
      // console.log(nodeList);
      var divList = nodeList.getElementsByTagName('div');

      if (divList.length) {
        // Sort through node list
        for (var i = 0, len = divList.length; i < len; i++) {
          var currentDiv = divList[i];
          var currentDivID = currentDiv.getAttribute('id');

          if ((/hyperfeed_story_i|u_jsonp|u_ps|substream/g).test(currentDivID)) {
            // currentDiv.style.cssText = 'border: 1px solid red';
            callback(currentDiv, configObj);
          }
        }
      }
    }

    /**
     * Checks the element to see if it should be filtered or not
     *
     * @param {Object} element - The element to apply a filter on
     * @param {Object} configObj - object containing all the filter keywords
     */
    function filterDivs(element, configObj) {
      if (configObj['words'].length) {
        var regExp = new RegExp('\\b(' + configObj['words'].join('|') + ')\\b' , 'gi');
        if (element.parentElement.classList.contains('_4-u2')) {
          // If the div matches a word in the configObj, hide it
          if (regExp.test(element.textContent)) {
            blockDiv(element);
          }
        }
      }
    }



    /**
     * Hide an element from a facebook timeline. Use a className
     * to detect whether this element has been parsed by Blissfully
     * yet. If not, then increment the counter
     *
     * @param element - element that's being hidden by Blissfully
     */
     function blockDiv(element) {
      var hiddenStyle = 'display: none;';
      // var hiddenStyle ='border: 1px solid green;'; //<- for debug
      if (!element.classList.contains('blissfully__Blocked')) {
        element.className += 'blissfully__Blocked';
        incrementBlockCounter();
      }

      element.style.cssText = hiddenStyle;
     }



    /**
     * log # of times keywords have been blocked
     *
     */
    function incrementBlockCounter() {
      CONFIG['blockCount'] += 1;
      setChromeStorage('blissfulData', CONFIG);
    }



    /**
     * Add a keyword to the Blissfully blacklist
     *
     * @param keyword - word to block
     * @param key - the config object's key
     */
    function addToFilter(keyword, key) {
      // If keyword does not exist, add to configObj
      if (CONFIG[key].indexOf(keyword) == -1) {
        CONFIG[key].push(keyword);
      }
      // Update the Chrome Storage
      setChromeStorage('blissfulData', CONFIG);
    }



    /**
     * Remove word from blacklist
     * 
     * @param {String} word - Word to remove
     * @param {String} type - type of source to filter (is it a word, or a domain name?)
     */
    function removeFromFilter(keyword, type) {
      var index = CONFIG[type].indexOf(keyword);

      // Add a check to ensure it's deletable, just in case
      if (index > -1) {
        CONFIG[type].splice(index, 1);
      }
      // Save to Global Config variable
      setChromeStorage('blissfulData', CONFIG);
    }



    /**
     * Send the value of blockCount to the background script
     */
    function sendBlockCount() {
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.method == "getLocalData") {
          sendResponse({ blockCount: CONFIG['blockCount'] });
        }
      });
    }


    /**
     * itshappening.gif!! Let's get the party started
     * and initialize Blissfully!!
     */
    function initialize() {
      loadStorage('blissfulData', function() {
          if (window.location.pathname == '/') {
            searchDOM(document.getElementById('substream_0'), filterDivs);
            searchDOM(document.getElementById('substream_1'), filterDivs);
          }

          // searchDOM(document, filterDivs);
          var DOMObserver = new trackDOMChanges();
          DOMObserver.observe();
          DOMObserver.validateInstance();
          sendBlockCount();
      });
    }


    return {
      init: initialize,
      config: function() {
        return CONFIG;
      },
      addToFilter: addToFilter,
      removeFromFilter: removeFromFilter    
    };


  })();

  Blissfully.init();  



})(window, document);


  
/*
//TODO
  √ TRIM whitespace before and after a word
  √ Adjust nodelist params that are scanned. Make sure to scan hyperfeed
  Add a class to the item that's going to be blocked
  Make sure script runs on homepage, but excludes status update box. Only
  for contentArea
*/

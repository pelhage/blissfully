(function(window, document) {

  var el = document.getElementById.bind(document);

  // Bind UI Actions once popup DOM has loaded
  document.addEventListener('DOMContentLoaded', function() {

    // On save button click 
    el('blissful-save').addEventListener('click', function() {
      saveKeyword();
    });

    // On hitting enter
    el('blissful-keyword').addEventListener("keyup", function (event) {
      if (event.keyCode == 13) {
        saveKeyword();
      }
    });

    // Parse and display blacklist
    el('blissful-blacklist').addEventListener('click', function() {
      // Display the keyword list
      el('blissful-add-keyword').classList.toggle('hide');
      el('blissful-view-blacklist').classList.toggle('hide');

      // Display the Keywords in the UI
      var wordsContainer = el('keyword-list');
      var keywords = Blissfully.config()['words'];
      displayKeywords(wordsContainer, keywords);
    });
    
  });



  /**
   * save the entered Keyword to the blacklist
   */
  function saveKeyword() {
    console.log('BEFORE: ', Blissfully.config());
    var keyword = el('blissful-keyword').value.trim();
    if (isEmpty(keyword)) {
      return;
    }

    Blissfully.addToFilter(keyword, 'words');
    el('blissful-keyword').value = '';
  }



  /**
   * Checks if input is empty/blank by using a regex to check for whitespace
   *
   * @param {String} str - string to check 
   * @return {Boolean} - boolean indicates whether string is blank
   */
  function isEmpty(str){
    return !str.replace(/^\s+/g, '').length; // boolean (`true` if field is empty)
  }



  /**
   * Displays the blacklist 
   */
  function displayKeywords(parentNode, keywordList) {
    keywordList.forEach(function(keyword) {
      var li = document.createElement('li');
      var div = document.createElement('div');
      var text = document.createTextNode(keyword);
      var button = document.createElement('button');
      var buttonText = document.createTextNode('Delete');
      button.className = 'blissful-delete-keyword';
      button.appendChild(buttonText);
      button.addEventListener('click', function() {
        Blissfully.removeFromFilter(keyword, 'words');
        parentNode.removeChild(li);
      });

      // Append elements to their respective places
      li.appendChild(text);
      li.appendChild(button);
      parentNode.appendChild(li);
    });
  }

  // Listen to content script for the block count value
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { method: "getLocalData" }, function(response) {
      el('blissfully__block-count').innerHTML = response.blockCount; 
    });
  });


  // When the extension is installed or upgraded ...
  chrome.runtime.onInstalled.addListener(function() {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      // With a new rule ...
      chrome.declarativeContent.onPageChanged.addRules([
        {
          // That fires when a page's URL is 'facebook' ...
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: { urlMatches: 'https://www.facebook.com/*' },
            })
          ],
          // And shows the extension's page action.
          actions: [ new chrome.declarativeContent.ShowPageAction() ]
        }
      ]);
    });
  });




//// some nice helpers
// var q = document.querySelector.bind(document);
// var qAll = document.querySelectorAll.bind(document);

// var each = function(query, fn) {
//   Array.prototype.slice.call(qAll(query), 0).forEach(fn);
// };
})(window, document);
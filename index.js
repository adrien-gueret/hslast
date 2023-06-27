(function () {
  var errorModal = document.getElementById("errorModal");
  var errorModalButton = document.getElementById("errorModalButton");
  var cardDetail = document.getElementById("cardDetail");
  var cardDetailTitle = document.getElementById("cardDetailTitle");
  var cardDetailClasses = document.getElementById("cardDetailClasses");
  var cardDetailInner = document.getElementById("cardDetailInner");
  var cardDetailImage = document.getElementById("cardDetailImage");
  var cardDetailChildren = document.getElementById("cardDetailChildren");
  var cardDetailQuote = document.getElementById("cardDetailQuote");
  var cardDetailButton = document.getElementById("cardDetailButton");
  var cardDetailPrevButton = document.getElementById("cardDetailPrevButton");
  var cardDetailNextButton = document.getElementById("cardDetailNextButton");
  var cardList = document.getElementById("cardList");
  var localeSelector = document.getElementById("localeSelector");
  var notificationButton = document.getElementById("notificationButton");
  var notificationModal = document.getElementById("notificationModal");
  var notificationModalButton = document.getElementById(
    "notificationModalButton"
  );
  var notificationModalCloseButton = document.getElementById(
    "notificationModalCloseButton"
  );

  var currentlyWatchedDomCardListItem = null;
  var storedScrollTop = 0;
  var revealedCardCount = 0;

  function changeLocale(newLocale) {
    localStorage.setItem("userLocale", newLocale);
    window.location.reload();
  }

  function translateUI(client) {
    [
      "mainTitle",
      "subtitle",
      "siteBy",
      "playOutside",
      "errorModalTitle",
      "errorModalContainer",
      "errorModalButton",
      "cardDetailButton",
      "cardDetailPrevButton",
      "cardDetailNextButton",
      "notificationModalTitle",
      "notificationModalContent",
      "notificationModalCloseButton",
    ].forEach(function (elementId) {
      var element = document.getElementById(elementId);
      element.innerHTML = translate(elementId);
    });

    client.onReady(() => {
      client.getLastExpansionName().then(function (expansionName) {
        document.getElementById("lastExpansionName").innerHTML = translate(
          "lastExpansionName",
          expansionName
        );
      });

      client.getLastExpansionCardCount().then(function (count) {
        revealedCardCount = count.revealed;
        document.getElementById("revealedCardCount").innerHTML = translate(
          "revealedCardCount",
          count.revealed,
          count.total
        );
      });
    });
  }

  function showErrorModal(title, content) {
    document.getElementById("errorModalTitle").innerHTML = title;
    document.getElementById("errorModalContainer").innerHTML = content;
    errorModal.style.display = "flex";
  }

  function hideErrorModal() {
    errorModal.style.display = "none";
  }

  function showNotificationModal() {
    notificationModal.style.display = "flex";
  }

  function hideNotificationModal() {
    notificationModal.style.display = "none";
  }

  function showCardDetail(domElementWithCardData, client) {
    domElementWithCardData.classList.remove("new");
    currentlyWatchedDomCardListItem = domElementWithCardData;

    if (currentlyWatchedDomCardListItem.previousSibling) {
      cardDetailPrevButton.style.removeProperty("display");
      cardDetailPrevButton.setAttribute(
        "href",
        "#" + currentlyWatchedDomCardListItem.previousSibling.id
      );
    } else {
      cardDetailPrevButton.style.setProperty("display", "none");
      cardDetailPrevButton.removeAttribute("href");
    }

    if (currentlyWatchedDomCardListItem.nextSibling) {
      cardDetailNextButton.style.removeProperty("display");
      cardDetailNextButton.setAttribute(
        "href",
        "#" + currentlyWatchedDomCardListItem.nextSibling.id
      );
    } else {
      cardDetailNextButton.style.setProperty("display", "none");
      cardDetailNextButton.removeAttribute("href");
    }

    var card = currentlyWatchedDomCardListItem.hearthstoneData;

    cardDetailImage.src = card.image;
    cardDetailImage.alt = card.name;

    cardDetailTitle.innerHTML = card.name;
    cardDetailQuote.innerHTML = card.flavorText;

    cardDetailChildren.innerHTML = "";

    client.getCardClasses(card).then(function (classes) {
      cardDetailClasses.innerHTML = classes
        .map(function (cardClass) {
          return cardClass.name;
        })
        .join(" - ");
    });

    if (card.childIds && card.childIds.length > 0) {
      client.getCardsByIds(card.childIds).then(function (childrenCards) {
        var childFragment = document.createDocumentFragment();

        childrenCards.forEach(function (childCard) {
          var image = document.createElement("img");
          image.src = childCard.image;
          image.alt = childCard.name;
          image.className = "card";

          childFragment.appendChild(image);
        });

        cardDetailChildren.appendChild(childFragment);
      });
    }

    cardDetailInner.scrollTop = 0;
    cardDetail.style.display = "flex";
  }

  function hideCardDetail() {
    window.location.hash = "";
    document.documentElement.scrollTop = storedScrollTop;
  }

  function showCardDetailFromHash(client) {
    if (window.location.hash) {
      var correspondingItem = document.querySelector(window.location.hash);
      showCardDetail(correspondingItem, client);
    } else {
      cardDetail.style.display = "none";
      cardDetailChildren.innerHTML = "";

      currentlyWatchedDomCardListItem = null;
    }
  }

  function createCardListItem(card) {
    const li = document.createElement("li");
    li.className = "card-list-item";
    li.hearthstoneData = card;
    li.id = card.slug.substr(card.slug.indexOf("-") + 1);

    const link = document.createElement("a");
    link.setAttribute("aria-label", card.name);
    link.href = "#" + li.id;

    const image = document.createElement("img");
    image.src = card.image;
    image.setAttribute("alt", card.name);
    image.className = "card card-link";

    link.appendChild(image);
    li.appendChild(link);

    return li;
  }

  function onClientInit(client) {
    client.getLastExpansionCards().then(function (cards) {
      cardList.innerHTML = "";
      var list = document.createElement("ul");
      list.id = "allRevealedCards";
      var listFragment = document.createDocumentFragment();

      cards.forEach(function (card) {
        var li = createCardListItem(card);
        listFragment.appendChild(li);
      });

      list.appendChild(listFragment);
      cardList.appendChild(list);

      showCardDetailFromHash(client);
    });
  }

  function prepareApp(client) {
    translateUI(client);

    localeSelector.value = window.currentLocale;

    localeSelector.addEventListener("change", function (e) {
      changeLocale(e.target.value);
    });

    function isTouchDevice() {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    }

    cardList.addEventListener("mousemove", function (e) {
      if (!e.target.classList.contains("card") || isTouchDevice()) {
        return;
      }

      var rect = e.target.getBoundingClientRect();
      var midWidth = rect.width / 2;
      var midHeight = rect.height / 2;

      var center = {
        x: rect.x + midWidth,
        y: rect.y + midHeight,
      };

      var limitRotateValue = 15;

      var deltaX = center.x - e.clientX;
      var deltaY = e.clientY - center.y;

      var rotateY = Math.floor((deltaX * limitRotateValue) / midWidth);
      var rotateX = Math.floor((deltaY * limitRotateValue) / midHeight);

      e.target.style.setProperty("--rotateX", rotateX + "deg");
      e.target.style.setProperty("--rotateY", rotateY + "deg");
    });

    cardList.addEventListener("mouseout", function (e) {
      if (!e.target.classList.contains("card")) {
        return;
      }

      e.target.blur();
      e.target.style.setProperty("--rotateX", "0deg");
      e.target.style.setProperty("--rotateY", "0deg");
    });

    cardDetail.addEventListener("click", (e) => {
      if (e.target === cardDetail) {
        hideCardDetail();
      }
    });

    errorModal.addEventListener("click", (e) => {
      if (e.target === errorModal) {
        hideErrorModal();
      }
    });

    notificationModal.addEventListener("click", (e) => {
      if (e.target === notificationModal) {
        hideNotificationModal();
      }
    });

    cardDetailButton.addEventListener("click", hideCardDetail);
    errorModalButton.addEventListener("click", hideErrorModal);
    notificationModalCloseButton.addEventListener(
      "click",
      hideNotificationModal
    );

    document.body.addEventListener("click", function (e) {
      if (e.target.classList.contains("card-link")) {
        storedScrollTop = document.documentElement.scrollTop;
        return false;
      }
    });

    window.addEventListener("hashchange", function () {
      showCardDetailFromHash(client);
    });

    notificationButton.addEventListener("click", () => {
      if (!areNotificationsEnabled) {
        showNotificationModal();
      } else {
        notificationModalButton.click();
      }
    });

    if (!("Notification" in window)) {
      notificationButton.parentNode.removeChild(notificationButton);
      return;
    }

    var areNotificationsEnabled = Notification.permission === "granted";

    function checkForUpdates() {
      var ONE_HOUR = 60 * 60 * 1000;
      var FIVE_MINUTES = ONE_HOUR / 12;

      window.setInterval(function () {
        client.getLastExpansionCardCount().then(function (count) {
          const newCardCount = count.revealed - revealedCardCount;

          if (newCardCount <= 0) {
            return;
          }

          revealedCardCount = count.revealed;
          document.getElementById("revealedCardCount").innerHTML = translate(
            "revealedCardCount",
            count.revealed,
            count.total
          );

          client.getLastExpansionCards(newCardCount).then(function (cards) {
            var list = document.getElementById("allRevealedCards");

            if (!list || !cards.length) {
              return;
            }

            const listFragment = document.createDocumentFragment();

            cards.forEach(function (card) {
              var li = createCardListItem(card);
              listFragment.appendChild(li);
              li.classList.add("new");

              if (areNotificationsEnabled) {
                var notif = new Notification("New card revealed!", {
                  body: card.name,
                  image: card.image,
                });

                notif.onclick = () => {
                  window.focus();
                  window.location.hash = li.id;
                };
              }
            });

            list.insertBefore(listFragment, list.firstChild);
          });
        });
      }, FIVE_MINUTES);
    }

    checkForUpdates();

    function toggleNotificationsIcon() {
      notificationModalButton.innerHTML = translate(
        "notificationModalButton",
        areNotificationsEnabled
      );

      if (areNotificationsEnabled) {
        notificationButton.classList.add("enabled");
      } else {
        notificationButton.classList.remove("enabled");
      }
    }

    toggleNotificationsIcon();

    notificationModalButton.addEventListener("click", () => {
      if (areNotificationsEnabled) {
        areNotificationsEnabled = false;
        toggleNotificationsIcon();
      } else {
        Notification.requestPermission().then((permission) => {
          areNotificationsEnabled = permission === "granted";
          toggleNotificationsIcon();
        });
      }

      hideNotificationModal();
    });
  }

  function onRequestError(e) {
    if (e instanceof DOMException) {
      return;
    }
    showErrorModal(
      translate("errorRequestTitle"),
      translate("errorRequestContent")
    );
  }

  var clientApi = new Client(onClientInit, onRequestError);

  prepareApp(clientApi);
})();

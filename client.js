(function (window) {
  function getHearthstoneMetadaFromLocalStorage(locale) {
    try {
      return JSON.parse(localStorage.getItem("hsMetadata." + locale));
    } catch (e) {
      return null;
    }
  }

  function getHearthstoneCardsByIdsFromLocalStorage(ids, locale) {
    try {
      return JSON.parse(
        localStorage.getItem(
          "hsCardsByIds." + JSON.stringify(ids) + "." + locale
        )
      );
    } catch (e) {
      return null;
    }
  }

  function saveHearthstoneCardsByIdsInLocalStorage(cards, ids, locale) {
    localStorage.setItem(
      "hsCardsByIds." + JSON.stringify(ids) + "." + locale,
      JSON.stringify(cards)
    );
  }

  function Client(onReadyCallback, onRequetError) {
    this.locale = window.currentLocale;

    this.accessToken = localStorage.getItem("accessToken") || null;
    this.accessTokenExpires = localStorage.getItem("accessTokenExpires") || 0;

    this.hearthstoneMetadata = {
      fr_FR: getHearthstoneMetadaFromLocalStorage("fr_FR"),
      en_US: getHearthstoneMetadaFromLocalStorage("en_US"),
    };

    this.hearthstoneMetadataExpires = {
      fr_FR: localStorage.getItem("hsMetadataExpires.fr_FR") || 0,
      en_US: localStorage.getItem("hsMetadataExpires.en_US") || 0,
    };

    this.abortFetchController = null;

    this.onReadyCallbacks = [];
    this.onRequetError = onRequetError || function () {};

    this.onReady(onReadyCallback);

    this.init();
  }

  Client.prototype.saveMetadataInStorage = function (storageKey, value) {
    var ONE_HOUR = 60 * 60 * 1000;
    var FIVE_MIUTES = ONE_HOUR / 12;

    this.hearthstoneMetadata[storageKey] = value;
    this.hearthstoneMetadataExpires[storageKey] = Date.now() + FIVE_MIUTES;

    localStorage.setItem("hsMetadata." + storageKey, JSON.stringify(value));
    localStorage.setItem(
      "hsMetadataExpires." + storageKey,
      this.hearthstoneMetadataExpires[storageKey]
    );
  };

  Client.prototype.isReady = function () {
    return (
      this.accessToken &&
      this.accessTokenExpires &&
      this.hearthstoneMetadata[this.locale] &&
      this.hearthstoneMetadataExpires[this.locale]
    );
  };

  Client.prototype.init = function () {
    var that = this;

    if (that.isReady()) {
      return;
    }

    that.fetchMetadata().then(function () {
      that.onReadyCallbacks.forEach(function (callback) {
        callback(that);
      });

      that.onReadyCallbacks = [];
    });
  };

  Client.prototype.onReady = function (callback) {
    if (this.isReady()) {
      callback(this);
    } else {
      this.onReadyCallbacks.push(callback);
    }
  };

  Client.prototype.setLocale = function (locale) {
    this.locale = locale;
    this.init();
  };

  Client.prototype.checkAccessTokenExpiration = function () {
    var that = this;

    if (that.accessTokenExpires <= Date.now()) {
      return that.fetchToken();
    }

    return Promise.resolve();
  };

  Client.prototype.catchRequestError = function (request) {
    return request
      .then(function (response) {
        if (!response.ok) {
          throw new Error(response);
        }
        return response.json();
      })
      .catch(this.onRequetError);
  };

  Client.prototype.getMetadata = function () {
    if (
      !this.hearthstoneMetadata[this.locale] ||
      this.hearthstoneMetadataExpires[this.locale] <= Date.now()
    ) {
      return this.fetchMetadata();
    }

    return Promise.resolve(this.hearthstoneMetadata[this.locale]);
  };

  Client.prototype.fetchMetadata = function () {
    var that = this;

    return that.checkAccessTokenExpiration().then(function () {
      var url =
        "https://eu.api.blizzard.com/hearthstone/metadata?locale=" +
        that.locale;

      var requestHeaders = new Headers({
        Authorization: "Bearer " + that.accessToken,
      });

      var requestOptions = {
        method: "GET",
        headers: requestHeaders,
      };

      return that
        .catchRequestError(fetch(url, requestOptions))
        .then(function (metadata) {
          that.saveMetadataInStorage(that.locale, metadata);
          return metadata;
        });
    });
  };

  Client.prototype.executeGetCardsRequest = function (queryParams) {
    var that = this;
    var url = "https://eu.api.blizzard.com/hearthstone/cards?";

    url += Object.keys(queryParams)
      .map(function (paramName) {
        var paramValue = queryParams[paramName];
        return paramName + "=" + paramValue;
      })
      .join("&");

    var requestHeaders = new Headers({
      Authorization: "Bearer " + that.accessToken,
    });

    if (that.abortFetchController) {
      that.abortFetchController.abort();
    }

    that.abortFetchController = new AbortController();

    var requestOptions = {
      method: "GET",
      headers: requestHeaders,
      signal: that.abortFetchController.signal,
    };

    return that.checkAccessTokenExpiration().then(function () {
      return that
        .catchRequestError(fetch(url, requestOptions))
        .then(function (cardData) {
          that.abortFetchController = null;
          return (cardData ? cardData.cards : []) || [];
        });
    });
  };

  Client.prototype.getLastExpansionCards = function (getLastCount) {
    var that = this;
    return that.getLastExpansionData().then(function (expansionData) {
      var finalQueryParams = {
        set: expansionData.slug,
        collectible: 1,
        pageSize: getLastCount ? getLastCount : expansionData.collectibleCount,
        locale: that.locale,
        sort: "dateadded:desc",
      };

      return that.executeGetCardsRequest(finalQueryParams);
    });
  };

  Client.prototype.getCardsByIds = function (cardIds) {
    var that = this;

    var cards = getHearthstoneCardsByIdsFromLocalStorage(cardIds, that.locale);

    if (cards) {
      return Promise.resolve(cards);
    }

    return that
      .executeGetCardsRequest({
        ids: cardIds,
        locale: that.locale,
      })
      .then(function (cards) {
        saveHearthstoneCardsByIdsInLocalStorage(cards, cardIds, that.locale);
        return cards;
      });
  };

  Client.prototype.fetchToken = function () {
    var that = this;

    var tokenApiUrl = "https://eu.battle.net/oauth/token";

    var oauthFormData = new FormData();
    oauthFormData.append("grant_type", "client_credentials");

    var oauthHeaders = new Headers({
      Authorization:
        "Basic M2IyZjhjN2JmOTBkNDU5Nzk2N2RmNmU4MGRkY2ZmZGQ6blJJTWJyQ0t1Q2IyQXVTV282b2pxeTdISHlvQ1kzV1Y=",
    });

    return that
      .catchRequestError(
        fetch(tokenApiUrl, {
          method: "POST",
          body: oauthFormData,
          headers: oauthHeaders,
        })
      )
      .then(function (response) {
        var TEN_MINUTES_IN_MS = 1000 * 60 * 10;
        that.accessToken = response.access_token;
        that.accessTokenExpires =
          Date.now() + response.expires_in * 1000 - TEN_MINUTES_IN_MS;

        localStorage.setItem("accessToken", that.accessToken);
        localStorage.setItem("accessTokenExpires", that.accessTokenExpires);

        return that;
      })
      .catch(that.onRequetError);
  };

  Client.prototype.getLastExpansionData = function () {
    return this.getMetadata().then(function (metadata) {
      return metadata.sets.find(function (setToCheck) {
        return (
          setToCheck.hyped === true ||
          setToCheck.type === "expansion" ||
          setToCheck.type === "adventure" ||
          setToCheck.collectibleRevealedCount <= setToCheck.collectibleCount
        );
      });
    });
  };

  Client.prototype.getLastExpansionName = function () {
    return this.getLastExpansionData().then(function (expansionData) {
      return expansionData.name.replace(/\+/, "");
    });
  };

  Client.prototype.getLastExpansionCardCount = function () {
    return this.getLastExpansionData().then(function (expansionData) {
      return {
        total: expansionData.collectibleCount,
        revealed: expansionData.collectibleRevealedCount,
      };
    });
  };

  Client.prototype.getLastExpansionSlug = function () {
    return this.getLastExpansionData().then(function (expansionData) {
      return expansionData.slug;
    });
  };

  Client.prototype.getClass = function (classId) {
    return this.getMetadata().then(function (metadata) {
      return metadata.classes.find(function (classToCheck) {
        return classToCheck.id === classId;
      });
    });
  };

  Client.prototype.getCardClasses = function (card) {
    var that = this;

    var allCardClassIds = card.multiClassIds
      .concat(card.classId)
      .filter(function (classId, index, allClasses) {
        return allClasses.indexOf(classId) === index;
      });

    var allClassesPromises = allCardClassIds.map(function (classId) {
      return that.getClass(classId);
    });

    return Promise.all(allClassesPromises);
  };

  window.Client = Client;
})(window);

(function(window) {
    var supportedLocales = [
        'de_DE', 'en_US', 'es_ES', 'fr_FR', 'it_IT', 'ja_JP',
        'ko_KR', 'pl_PL', 'pt_BR', 'ru_RU', 'th_TH', 'zh_TW',
    ];

    var defaultLocale = 'en_US';

    var storedLanguage = localStorage.getItem('userLocale');
    var languageToCheck = storedLanguage ? storedLanguage : (navigator.language ? navigator.language : 'en');

    var userLanguage =  languageToCheck.substring(0, 2);

    window.currentLocale = supportedLocales.find(function(locale) {
        var localeLanguage =  locale.substring(0, 2);
        return localeLanguage === userLanguage;
    }) || defaultLocale;

    var currentLanguage = window.currentLocale.substring(0, 2);
    document.documentElement.lang = currentLanguage;

    var translations = {
        fr_FR: {
            mainTitle: 'HSLast',
            subtitle: 'Découvrez les dernières cartes Hearthstone révélées&nbsp;!',
            errorModalTitle: 'Erreur réseau !',
            errorModalContainer: 'Une erreur est survenue lors de la récupération des données des cartes depuis les serveurs de Blizzard.<br />Désolé, mais vous allez devoir revenir plus tard...',
            errorModalButton: 'Fermer',
            cardDetailButton: 'Fermer',
            cardDetailPrevButton: 'Carte précédente',
            cardDetailNextButton: 'Carte suivante',
            lastExpansionName(expansionName) {
                return `La dernière extension est <em>${expansionName}</em>`;
            },
            revealedCardCount(revealedCount, total) {
                const pluralText = revealedCount > 1 ? 'cartes révélées' : 'carte révélée';
                const leftCount = total - revealedCount;
                const leftText = leftCount > 0 ? ` <i>(encore <b>${leftCount}</b>&nbsp;!)</i>` : '';

                return `<b>${revealedCount}</b> ${pluralText} sur un total de <b>${total}</b>${leftText}`;
            },
            notificationModalButton(areNotificationsEnabled) {
                return areNotificationsEnabled ? 'Désactiver' : 'Activer';
            },
            notificationModalTitle: 'Recevez une notification quand une nouvelle carte est révélée',
            notificationModalContent: 'Autorisez et activez les notifications, laissez cet onglet ouvert et recevez une alerte automatiquement quand une nouvelle carte est révélée !',
            notificationModalCloseButton: 'Fermer',
        },
        en_US: {
            mainTitle: 'HSLast',
            subtitle: 'Discover the last Hearthstone revealed cards!',
            errorModalTitle: 'Network error!',
            errorModalContainer: 'An error occured while trying to get cards data from Blizzard servers.<br />Sorry, but you\'ll have to come here later...',
            errorModalButton: 'Close',
            cardDetailButton: 'Close',
            cardDetailPrevButton: 'Previous card',
            cardDetailNextButton: 'Next card',
            lastExpansionName(expansionName) {
                return `Last expansion is <em>${expansionName}</em>`;
            },
            revealedCardCount(revealedCount, total) {
                const pluralText = revealedCount > 1 ? 'cards' : 'card';
                const leftCount = total - revealedCount;
                const leftText = leftCount > 0 ? ` <i>(<b>${leftCount}</b> left!)</i>` : '';

                return `<b>${revealedCount}</b> revealed ${pluralText} out of <b>${total}</b>${leftText}`;
            },
            notificationModalButton(areNotificationsEnabled) {
                return areNotificationsEnabled ? 'Disable' : 'Enable';
            },
            notificationModalTitle: 'Receive a notification when a new card is revealed',
            notificationModalContent: 'Authorize and enable notifications, keep this tab opened and receive a notification as soon as a new card is revealed!',
            notificationModalCloseButton: 'Close',
        }
    };

    window.translate = function (key, ...variables) {
        var localeToUse = window.currentLocale;
        
        if  (!translations[localeToUse]) {
            localeToUse = defaultLocale;
        }

        if  (!translations[localeToUse]) {
            return key;
        }

        var translation = translations[localeToUse][key];

        if (!translation) {
            return key;
        }

        if (translation instanceof Function) {
            return translation(...variables);
        }

        return translation;
    };
})(window);
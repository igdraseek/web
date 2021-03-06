var options = {
    keepHistory: 1000 * 60 * 5,  // expired in 5 minutes.
    localSearch: true
};
var fields = ['merchant', 'title', 'productCategoryName'];

ItemSearch = new SearchSource('items', fields, options);

Template.searchBox.helpers({
    getMatches: function() {
        var items = ItemSearch.getData({
            transform: function (matchText, regExp) {
                return matchText.toString().replace(regExp, "<b>$&</b>")
            },
            docTransform: function (doc) {
                return _.extend(doc, {
                    matchData: function () {
                        var matchData = [];
                        var merchantName = doc.merchant;
                        if (doc['merchant'].indexOf("<b>") != -1) {
                            merchantName = merchantName.replace("<b>", "");
                            merchantName = merchantName.replace("</b>", "");

                            matchData.push({
                                matchField: 'merchant',
                                matchText: doc.merchant + ' in ' + doc.productCategoryName,
                                link: '/itemList/' + doc.productCategory + '/brand/' + merchantName,
                                class: 'searchMerchant'
                            });
                        }
                        if (doc['productCategoryName'].indexOf("<b>") != -1) {
                            matchData.push({
                                matchField: 'productCategoryName',
                                matchText: 'Shop for ' + doc.productCategoryName,
                                link: '/itemList/' + doc.productCategory + '/brand/' + merchantName,
                                class: 'searchCategory'
                            });
                        }
                        if (doc['title'].indexOf("<b>") != -1) {
                            matchData.push({
                                matchField: 'title',
                                matchText: doc.title,
                                link: '#',
                                class: 'searchItem',
                                data: doc
                            });
                        }

                        return matchData;
                    }
                })
            }
        });

        var matches = [];
        var categoryMatches = [];
        var categoryMatchesCount = 0
        var brandMatches = [];
        var brandMatchesCount = 0;
        var titleMatches = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var matchData = item.matchData();
            console.log('matchData:');
            console.dir(matchData);

            for (var j = 0; j < matchData.length; j++) {
                var match = matchData[j];
                console.log('match:');
                console.dir(match);

                if (categoryMatchesCount == 0 && match['matchField'] == 'productCategoryName') {
                    categoryMatches.push(match);
                    categoryMatchesCount++;
                }
                if (brandMatchesCount == 0 && match['matchField'] == 'merchant') {
                    brandMatches.push(match);
                    brandMatchesCount++
                }
                if (match['matchField'] == 'title') {
                    titleMatches.push(match);
                }
            }
        }

        if (categoryMatchesCount > 0) {
            matches.push({matches: categoryMatches});
        }
        if (brandMatchesCount > 0) {
            matches.push({matches: brandMatches});
        }
        if (titleMatches.length > 0) {
            matches.push({matches: titleMatches});
        }

        return matches;
    },

    isLoading: function() {
        return ItemSearch.getStatus().loading;
    }
});

Template.searchBox.events({
    "keyup #search-box": _.throttle(function(e) {
        var text = $(e.target).val().trim();
        console.log("search text: " + text);
        ItemSearch.search(text, {limit : 20});
    }, 300),

    "click .searchItem": function(e) {
        // prevent the default behavior
        event.preventDefault();

        Session.set('selectedItem', this.data);
    }
});
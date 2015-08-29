Accounts.onCreateUser(function(options, user) {
    if (options.profile) {
        user.profile = options.profile;
    } else if (user.profile == undefined) {
        user.profile = {};
    }
    _.extend(user.profile, { collections : [] });
    return user;
});

/**************** Fiber ****************/
var Fiber = Meteor.npmRequire('fibers');

Meteor.startup(function() {
    var merchants = [
        {
            brand: 'Synergy Organic Clothing',
            amznId: '',
            productCategory: ProductCategory.FASHION,
            socialCategories: [
                SociallyResponsibleCategory.ORGANIC
            ],
            certs: [
                Certificates.GGA,
                Certificates.GOTS
            ],
            bCorpScore: 0,
            keywords: [
                'organic clothing',
                'synergy',
                'clothes'
            ]
        },
        {
            brand: 'Indosole',
            amznId: '',
            productCategory: ProductCategory.SHOES,
            socialCategories: [
                SociallyResponsibleCategory.UPCYCLER
            ],
            certs: [],
            bCorpScore: 74,
            keywords: [
                'Sustainable',
                'shoes'
            ]
        },
        {
            brand: 'Oaklandish',
            amznId: '',
            productCategory: ProductCategory.FASHION,
            socialCategories: [],
            certs: [],
            bCorpScore: 100,
            keywords: [
                'oakland t-shirt'
            ]
        },
        {
            brand: 'Bixbee',
            amznId: '',
            productCategory: ProductCategory.LUGGAGE,
            socialCategories: [
                SociallyResponsibleCategory.ONE_FOR_ONE
            ],
            certs: [],
            bCorpScore: 83,
            keywords: [
                'one for one',
                'backpack'
            ]
        }
    ];

    // Populate the merchants table.
    if (!Merchants.findOne() && !Items.findOne()) {
        _.each(merchants, function (merchant) {
            initializeMerchantsAndItems(merchant);
        });
    }
});

// For now we just go get the first item of the given brand and category.
function initializeMerchantsAndItems(merchant) {
    Fiber(function() {
        var category = merchant.productCategory;
        var brand = merchant.brand;

        var categoryName = ProductCategory.properties[category].name;
        console.log("search for: " + categoryName + " for " + brand);

        // Async search on amazon and wait for the result from the fiber.
        var itemSearchRes = amznItemSearch(categoryName, brand);

        var itemArray = parseItemSearchRes(itemSearchRes);

        for (var i = 0; i < itemArray.length; i++) {
            var dbItem = {
                productCategory: category,
                productCategoryName: ProductCategory.properties[category].descriptiveName,
                socialCategories: [],
                merchant: brand
            };
            var asin = parseItem(itemArray[i], dbItem);

            // Look up image for the item.
            var imageSearchRes = amznItemImage(asin);
            parseImageSearchRes(imageSearchRes, dbItem);

            if (i == 0) {
                merchant['coverItem'] = dbItem;
                Merchants.insert(merchant, function (err, res) {
                    if (err) {
                        console.log('err inserting merchant: ' + brand + "\n" + err);
                    } else {
                        console.log("inserted merchant " + brand);
                    }
                });
            }

            Items.update(
                { _id: asin.toString()},
                {
                    $setOnInsert: {
                        productCategory: dbItem.productCategory,
                        productCategoryName: dbItem.productCategoryName,
                        socialCategories: dbItem.socialCategories,
                        merchant: dbItem.merchant,
                        detailUrl: dbItem.detailUrl,
                        title: dbItem.title,
                        feature: dbItem.features,
                        imageUrl: dbItem.imageUrl,
                        collections: [],
                        trending_score: 1.0
                    },
                    $currentDate: {
                        last_accessed: {$type: "timestamp"}
                    }
                },
                function (err, res) {
                    if (err) {
                        console.log('err inserting to Items: ' + err);
                    }
                });

            // Amazon throttles itemLookup request.
            Meteor._sleepForMs(200);
        }
    }).run();
}

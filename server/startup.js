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
            socialResCateory: [
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
            socialResCateory: [
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
            socialResCateory: [],
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
            socialResCateory: [
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

    if (Merchants.find().count() == 0) {
        _.each(merchants, function (merchant) {
            Merchants.insert(merchant);
        });
    }

    if (CoverItems.find().count() == 0) {
        // For each merchant, fetch its products (8 products are returned on each request),
        // and get the cover item (for now that's just the first item returned).
        _.each(merchants, function(merchant) {
            getCoverItem(merchant.productCategory, merchant.brand);
        });
     }
});

// For now we just go get the first item of the given brand and category.
function getCoverItem(category, brand) {
    Fiber(function() {
        var categoryName = ProductCategory.properties[category].name;
        console.log("search for: " + categoryName + " for " + brand);

        // Async search on amazon and wait for the result from the fiber.
        var itemSearchRes = amznItemSearch(categoryName, brand);
        var dbItem = {};

        var itemArray = parseItemSearchRes(itemSearchRes);
        // Only get image for the cover item, for now this is the first item.
        var asin = parseItem(itemArray[0], dbItem);

        // Look up image for the item.
        var imageSearchRes = amznItemImage(asin);
        parseImageSearchRes(imageSearchRes, dbItem);

        CoverItems.update(
            { _id: asin.toString()},
            {
                $setOnInsert: {
                    productCategory: category,
                    productCategoryName: ProductCategory.properties[category].descriptiveName,
                    merchant: brand,
                    detailUrl: dbItem.detailUrl,
                    title: dbItem.title,
                    feature: dbItem.features
                },
                $set: {
                    imageUrl: dbItem.imageUrl
                }
            },
            { upsert: true},
            function(err, res) {
               if (err) {
                    console.log('err: ' + err);
               }
            });
        Meteor._sleepForMs(200);
    }).run();
}

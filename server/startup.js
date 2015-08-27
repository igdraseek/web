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

    if (Merchants.find().count() == 0) {
        _.each(merchants, function (merchant) {
            insertMerchantWithCoverItem(merchant);
        });
    }
});

// For now we just go get the first item of the given brand and category.
function insertMerchantWithCoverItem(merchant) {
    Fiber(function() {
        var category = merchant.productCategory;
        var brand = merchant.brand;

        var categoryName = ProductCategory.properties[category].name;
        console.log("search for: " + categoryName + " for " + brand);

        // Async search on amazon and wait for the result from the fiber.
        var itemSearchRes = amznItemSearch(categoryName, brand);
        var coverItem = {};

        var itemArray = parseItemSearchRes(itemSearchRes);
        // Only get image for the cover item, for now this is the first item.
        var asin = parseItem(itemArray[0], coverItem);
        // Override the title.
        coverItem.title = categoryName;

        // Look up image for the item.
        var imageSearchRes = amznItemImage(asin);
        parseImageSearchRes(imageSearchRes, coverItem);

        merchant['coverItem'] = coverItem;
        Merchants.insert(merchant, function (err, res) {
           if (err) {
                console.log('err inserting merchant: ' + brand + "\n" + err);
           } else {
               console.log("inserted merchant " + brand);
           }
        });
    }).run();
}

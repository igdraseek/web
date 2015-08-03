/**************** Fiber ****************/
var Fiber = Meteor.npmRequire('fibers');

/********** Amazon API helper ***********/
var util = Meteor.npmRequire('util'),
    OperationHelper = Meteor.npmRequire('apac').OperationHelper;

var opHelper = new OperationHelper({
    awsId:     'AKIAJGASX5JUQORNBMGQ',
    awsSecret: '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',
    assocId:   'igdraseek-20',
    // xml2jsOptions: an extra, optional, parameter for if you want to pass additional options for the xml2js module.
    // (see https://github.com/Leonidas-from-XIV/node-xml2js#options)
    version:   '2013-08-01'
    // your version of using product advertising api, default: 2013-08-01
});

var SOCIAL_RESP_CATEGORY = [
    "Local",
    "Sustainable",
    "Women Owned",
    "Veteran",
    "Disabled Owned",
    "Low Income Neighborhood",
    "Organic"
];

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
        // startSearch('Shoes', 'Indosole');
        _.each(merchants, function(merchant) {
            getCoverItems(merchant.productCategory, merchant.brand);
        });
     }
});

function getCoverItems(category, brand) {
    Fiber(function() {
        var categoryName = ProductCategory.properties[category].name;
        console.log("search for: " + categoryName + " for " + brand);
        // Async search on amazon and wait for the result from the fiber.
        var itemSearchRes = amznItemSearch(categoryName, brand);
        var dbItem = {};

        var itemArray = parseItemSearchRes(itemSearchRes);
        var asin = parseItem(itemArray[0], dbItem);

        var imageSearchRes = amznItemLookup(asin);
        parseImageSearchRes(imageSearchRes, dbItem);

        CoverItems.update(
            { _id: asin.toString()},
            {
                $setOnInsert: {
                    productCategory: category,
                    merchant: brand,
                    detailUrl: dbItem.detailUrl,
                    title: ProductCategory.properties[category].descriptiveName,
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

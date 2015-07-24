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
            productCategory: 'Apparel',
            socialResCateory: [
                'Organic'
            ],
            keywords: [
                'organic clothing',
                'synergy',
                'clothes'
            ]
        },
        {
            brand: 'Indosole',
            productCategory: 'Shoes',
            socialResCateory: [],
            keywords: [
                'Sustainable',
                'shoes'
            ]
        },
        {
            brand: 'Oaklandish',
            productCategory: 'Apparel',
            socialResCateory: [],
            keywords: [
                'oakland',
                't-shirt',
                'tshirt'
            ]
        }
    ];

    if (Merchants.find().count() == 0) {
        _.each(merchants, function (merchant) {
            Merchants.insert(merchant);
        });
    }

    // TODO(luping): need to define TopItems better.
    if (TopItems.find().count() == 0) {
        startSearch('Shoes', 'Indosole');
         //_.each(merchants, function(merchant) {
             //startSearch(merchant.productCategory, merchant.brand);
         //});
     }
});

function startSearch(category, brand) {
    Fiber(function() {

        // Async search on amazon and wait for the result from the fiber.
        var itemSearchRes = amznItemSearch('Shoes', 'Indosole');

        // Parese the ItemSearch result to get the itemId
        var response = itemSearchRes['ItemSearchResponse'];
        var items = response['Items'][0];
        var itemArray = items['Item'];

        for (var i = 0; i < itemArray.length; i++) {
            var item = itemArray[i];
            var asin = item['ASIN'];
            var detailUrl = item['DetailPageURL'];
            var attrs = item['ItemAttributes'][0];
            var title = attrs['Title'];
            var features = attrs['Feature'];

            var imageSearchRes = amznItemLookup(asin);
            var imageResponse = imageSearchRes['ItemLookupResponse'];
            var imageItems = imageResponse['Items'][0];
            var imageItem = imageItems['Item'][0];
            var image = imageItem['MediumImage'][0];
            console.dir(image['Height']);

            var dbItem = {
                'detailUrl': detailUrl,
                'title': title,
                'feature': features,
                'imageUrl': image['URL']
            };

            TopItems.update(
                { _id: asin.toString()},
                {
                    $setOnInsert: dbItem
                },
                { upsert: true},
                function(err, res) {
                    console.log('------- inserting ------');
                    console.log(dbItem['title']);
                    if (err) {
                        console.log('err: ' + err);
                    } else {
                        console.dir('update res: ' + res.toString());
                    }
                    console.log('-------------------------');
                });
        }
    }).run();
}


function amznItemSearch(category, brand) {
    var fiber = Fiber.current;

    // execute(operation, params, callback)
    // operation: select from http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SummaryofA2SOperations.html
    // params: parameters for operation (optional)
    // callback(err, parsed, raw): callback function handling results. err = potential errors raised from
    // xml2js.parseString() or http.request(). parsed = xml2js parsed response. raw = raw xml response.

    opHelper.execute('ItemSearch', {
        'SearchIndex': category,
        'Brand': brand,
        'ResponseGroup': 'ItemAttributes'
    }, function (err, jsonRes, xmlRes) { // you can add a third parameter for the raw xml response, "results" here are currently parsed using xml2js
        fiber.run(jsonRes);
    });

    return Fiber.yield();
}

function amznItemLookup(itemId, dbItem) {
    var fiber = Fiber.current;

    opHelper.execute('ItemLookup', {
        'ItemId': itemId,
        'IdType' : 'ASIN',
        'ResponseGroup': 'Images'
    }, function (err, jsonRes, xmlRes) {
        fiber.run(jsonRes);
    });

    return Fiber.yield();
}


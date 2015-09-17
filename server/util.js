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

amznItemSearch = function (category, brand) {
    var fiber = Fiber.current;

    // execute(operation, params, callback)
    // operation: select from http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SummaryofA2SOperations.html
    // params: parameters for operation (optional)
    // callback(err, parsed, raw): callback function handling results. err = potential errors raised from
    // xml2js.parseString() or http.request(). parsed = xml2js parsed response. raw = raw xml response.

    opHelper.execute('ItemSearch', {
        'SearchIndex': category,
        'Brand': brand,
        'ResponseGroup': 'ItemAttributes,Offers,Images,VariationSummary'
    }, function (err, jsonRes, xmlRes) { // you can add a third parameter for the raw xml response, "results" here are currently parsed using xml2js
        if(err) {
            console.log('err in amznItemSearch for ' + brand + ': ' + err);
            console.dir(xmlRes);
        } else {
            fiber.run([jsonRes, xmlRes]);
        }
    });

    return Fiber.yield();
};

amznItemLookup = function(itemId) {
    var fiber = Fiber.current;

    opHelper.execute('ItemLookup', {
        'ItemId': itemId,
        'IdType' : 'ASIN',
        'ResponseGroup': 'ItemAttributes,Offers,Images,VariationSummary'
    }, function (err, jsonRes, xmlRes) {
        if (err) {
            console.log('err in amznItemLookup for ' + itemId + ': ' + err);
            console.dir(xmlRes);
        } else {
            fiber.run([jsonRes, xmlRes]);
        }
    });

    return Fiber.yield();
};


parseItemSearchRes = function (res) {
    var jsonResponse = res[0];
    var xmlResponse = res[1];

    // Parese the ItemSearch result to get the itemId
    var response = jsonResponse['ItemSearchResponse'];
    if (response == undefined) {
        console.error("ItemSearchResponse is undefined: " + xmlResponse);
        return;
    }
    var items = response['Items'][0];
    var itemArray = items['Item'];

    if (itemArray == undefined) {
        console.error('ItemSearchResponse: No Items found for items:\n' + items);
        return;
    }

    return itemArray;
};

parseItem = function(amznItem, dbItem) {
    var asin = amznItem['ASIN'];

    dbItem.detailUrl = amznItem['DetailPageURL'];

    // Parse the attributes
    var attrs = amznItem['ItemAttributes'][0];
    dbItem.title = attrs['Title'];
    dbItem.features = attrs['Feature'];

    // Parse the offer to get price and amazon-prime info
    var offers = amznItem['Offers'];
    var offer = offers[0]['Offer'];
    if (!offer) {
        console.error("No offer for " + dbItem.title +", try VariationSummary");
        var variations = amznItem['VariationSummary'];
        dbItem.price = variations[0]['LowestPrice'];
    } else {
        var offerListing = offer[0]['OfferListing'];
        if (offerListing) {
            dbItem.price = offerListing['Price'];
            dbItem.isEligibleForPrime = offerListing['IsEligibleForPrime'];
        }
    }

    // Parse the images
    parseItemImages(amznItem, dbItem);

    console.log("parsed dbItem:");
    console.dir(dbItem);

    return asin;
};

parseItemLookupRes = function(res) {
    var jsonResponse = res[0];
    var xmlResponse = res[1];

    var response = jsonResponse['ItemLookupResponse'];
    if (response == undefined) {
        console.error("ItemLookupResponse is undefined: " + xmlResponse);
        return;
    }
    var items = response['Items'][0];
    var itemArray = items['Item'];

    if (itemArray == undefined) {
        console.error('ItemLookupResponse: No Items found for items:\n' + items);
        return;
    }

    return itemArray;
};

parseItemImages = function(amznItem, dbItem) {
    if (!amznItem) {
        dbItem.mediumImageUrl = "/img/default.png";
    } else {
        var mediumImage = amznItem['MediumImage'][0];
        if (mediumImage) {
            dbItem.mediumImageUrl = mediumImage['URL'];
        }
        var largeImage = amznItem['LargeImage'][0];
        if (largeImage) {
            dbItem.largeImageUrl = largeImage['URL'];
        }

        var smallImage = amznItem['SmallImage'][0];
        if (smallImage) {
            dbItem.smallImageUrl = smallImage['URL'];
        }
    }
};

// Only call this from within a Fiber.
upsertItem = function(asin, dbItem, brand, category) {
    Items.update(
        { _id: asin.toString()},
        {
            $setOnInsert: {
                productCategory: category,
                productCategoryName: ProductCategory.properties[category].descriptiveName,
                socialCategories: [],
                merchant: brand,
                detailUrl: dbItem.detailUrl,
                title: dbItem.title,
                isEligibleForPrime: dbItem.isEligibleForPrime,
                feature: dbItem.features,
                collections: [],
                trending_score: 1.0
            },
            //$currentDate: {
            //    last_accessed: {$type: "timestamp"}
            //},
            $set: {
                price: dbItem.price,
                largeImageUrl: dbItem.largeImageUrl,
                mediumImageUrl: dbItem.mediumImageUrl,
                smallImageUrl: dbItem.smallImageUrl
            }                },
        { upsert: true},
        function(err, res) {
            if (err) {
                console.log('err: ' + err);
            }
        });
};
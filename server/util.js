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
        'ResponseGroup': 'ItemAttributes'
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

amznItemImage = function(itemId, dbItem) {
    var fiber = Fiber.current;

    opHelper.execute('ItemLookup', {
        'ItemId': itemId,
        'IdType' : 'ASIN',
        'ResponseGroup': 'Images'
    }, function (err, jsonRes, xmlRes) {
        if (err) {
            console.log('err in amznItemImage for ' + dbItem.title + ': ' + err);
            console.dir(xmlRes);
        } else {
            fiber.run([jsonRes, xmlRes]);
        }
    });

    return Fiber.yield();
};

amznItemDetails = function(itemId) {
    var fiber = Fiber.current;

    opHelper.execute('ItemLookup', {
        'ItemId': itemId,
        'IdType' : 'ASIN',
        'ResponseGroup': 'ItemAttributes,Images'
    }, function (err, jsonRes, xmlRes) {
        if (err) {
            console.log('err in amznItemDetails for ' + itemId + ': ' + err);
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
        console.error("Response is undefined: " + xmlResponse);
        return;
    }
    var items = response['Items'][0];
    var itemArray = items['Item'];

    if (itemArray == undefined) {
        console.error('No Items found for ' + categoryName + ', items:\n' + items);
        return;
    }

    return itemArray;
};

parseItem = function(amznItem, dbItem) {
    dbItem.detailUrl = amznItem['DetailPageURL'];

    var attrs = amznItem['ItemAttributes'][0];
    dbItem.title = attrs['Title'];
    dbItem.features = attrs['Feature'];
    dbItem.price = {FormattedPrice: "$$$"};  // Implement next.
    dbItem.isEligibleForPrime = 0;  // Implement next.

    return amznItem['ASIN'];
};

parseImageSearchRes = function(res, dbItem) {
    var jsonResponse = res[0];
    var xmlResponse = res[1];

    var response = jsonResponse['ItemLookupResponse'];
    if (response != undefined) {
        var imageItems = response['Items'][0];
        var imageItem = imageItems['Item'][0];
        parseImageItem(imageItem, dbItem);
    } else {
        console.warn('ImageResponse is undefined for \"' + dbItem.title + '\"\n' + xmlResponse);
    }
};

parseImageItem = function(imageItem, dbItem) {
    if (!imageItem) {
        dbItem.mediumImageUrl = "/img/default.png";
    } else {
        var mediumImage = imageItem['MediumImage'][0];
        if (mediumImage != undefined) {
            dbItem.mediumImageUrl = mediumImage['URL'];
        }
        var largeImage = imageItem['LargeImage'][0];
        if (largeImage != undefined) {
            dbItem.largeImageUrl = largeImage['URL'];
        }

        var smallImage = imageItem['SmallImage'][0];
        if (smallImage != undefined) {
            dbItem.smallImageUrl = smallImage['URL'];
        }
    }
};
Meteor.startup(function() {
    var util = Meteor.npmRequire('util');
    var OperationHelper = Meteor.npmRequire('apac').OperationHelper;

    var opHelper = new OperationHelper({
        awsId:     'AKIAJGASX5JUQORNBMGQ',
        awsSecret: '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',
        assocId:   'igdraseek-20',
        // xml2jsOptions: an extra, optional, parameter for if you want to pass additional options for the xml2js module.
        // (see https://github.com/Leonidas-from-XIV/node-xml2js#options)
        version:   '2013-08-01'
        // your version of using product advertising api, default: 2013-08-01
    });


// execute(operation, params, callback)
// operation: select from http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SummaryofA2SOperations.html
// params: parameters for operation (optional)
// callback(err, parsed, raw): callback function handling results. err = potential errors raised from
// xml2js.parseString() or http.request(). parsed = xml2js parsed response. raw = raw xml response.

    opHelper.execute('ItemSearch', {
        'SearchIndex': 'Apparel',
        'Brand': 'Synergy Organic Clothing',
        // 'BrowseNode':'7141123011',
        'ResponseGroup': 'ItemAttributes'
    }, function(err, results) { // you can add a third parameter for the raw xml response, "results" here are currently parsed using xml2js
        var response = results['ItemSearchResponse'];
        var items = response['Items'][0];

        var item = items['Item'];
        console.log(item);
        for (var key in item) {
            console.log(key);
        }
    });
});


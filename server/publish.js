var Fiber = Meteor.npmRequire('fibers');

Meteor.publish('merchants', function() {
   return Merchants.find();
});

/**
 * TODO(luping): remove this.
 */
Meteor.publish('itemsForBrand', function(brand, category) {
   var categoryName = ProductCategory.properties[category].name;

   if (!Items.findOne({merchant: brand, productCategory: category})) {
       console.log('Items for brand ' + brand + 'is empty');
       Fiber(function() {
           // Async search on amazon and wait for the result from the fiber.
           var itemSearchRes = amznItemSearch(categoryName, brand);
           var itemArray = parseItemSearchRes(itemSearchRes);

           for (var i = 0; i < itemArray.length; i++) {

              var dbItem = {};
              var asin = parseItem(itemArray[i], dbItem);
              getImageUrlAndUpdateItem(asin, dbItem, brand, category);
              Meteor._sleepForMs(150);
          }
      }).run();
   } else {
       var query = { merchant: brand, productCategory: category, mediumImageUrl: '/img/default.png'};
       var itemsWithoutImage = Items.find(query);
       console.log(query);
        if (itemsWithoutImage.count() > 0) {
            console.log('Fetching images for subset of ' + itemsWithoutImage.count()
                + ' for ' + brand);
            Fiber(function() {
                var itemArray = itemsWithoutImage.fetch();
                for (var i = 0; i < itemArray.length; i++) {
                    var dbItem = itemArray[i];
                    var asin = dbItem._id;
                    getImageUrlAndUpdateItem(asin, dbItem, brand, category);
                    Meteor._sleepForMs(150);
                }
            }).run();
       }
   }

   // TODO(luping): add sortby and limit.
   return Items.find({ merchant: brand, productCategory: category});
});

Meteor.publish('userCollections', function(collectionId) {
    return UserCollections.find({_id: collectionId});
});

Meteor.publish('collectedItems', function() {
    return CollectedItems.find();
});

// Only call this from within a Fiber.
function getImageUrlAndUpdateItem(asin, dbItem, brand, category) {
    var imageSearchRes = amznItemImage(asin);
    parseImageSearchRes(imageSearchRes, dbItem);

    // TODO(luping): if failed to fetch image (due to Amazon throttling, schedule to refetch
    // the item in a little bit. Currently you have to manually refresh the page.

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
                price: dbItem.price,
                isEligibleForPrime: dbItem.isEligibleForPrime,
                feature: dbItem.features,
                collections: [],
                trending_score: 1.0
            },
            //$currentDate: {
            //    last_accessed: {$type: "timestamp"}
            //},
            $set: {
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
}
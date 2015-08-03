var Fiber = Meteor.npmRequire('fibers');

Meteor.publish('coverItems', function() {
   return CoverItems.find();
});

Meteor.publish('topItems', function(brand, category) {
   var categoryName = ProductCategory.properties[category].name;
   console.log("publish topItems, category: " + categoryName + ", brand: " + brand);

   if (TopItems.findOne({merchant: brand, productCategory: category}) == undefined) {
       console.log('TopItems is empty');
      Fiber(function() {
         // Async search on amazon and wait for the result from the fiber.
         var itemSearchRes = amznItemSearch(categoryName, brand);
         var itemArray = parseItemSearchRes(itemSearchRes);

          for (var i = 0; i < itemArray.length; i++) {

              var dbItem = {};
              var asin = parseItem(itemArray[i], dbItem);
              getImageUrlAndUpdateItem(asin, dbItem, brand, category);
              Meteor._sleepForMs(100);
          }
      }).run();
   } else {
       var query = { merchant: brand, productCategory: category, imageUrl: '/img/default.png'};
       var itemsWithoutImage = TopItems.find(query);
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
                    Meteor._sleepForMs(100);
                }
            }).run();
       }
   }

   // TODO(luping): add sortby and limit.
   return TopItems.find({ merchant: brand, productCategory: category});
});

// Only call this from within a Fiber.
function getImageUrlAndUpdateItem(asin, dbItem, brand, category) {
    var imageSearchRes = amznItemLookup(asin);
    parseImageSearchRes(imageSearchRes, dbItem);
    // TODO(luping): if failed to fetch image, schedule to refetch the item in a little bit.

    TopItems.update(
        { _id: asin.toString()},
        {
            $setOnInsert: {
                productCategory: category,
                merchant: brand,
                detailUrl: dbItem.detailUrl,
                title: dbItem.title,
                feature: dbItem.features
            },
            $set: {
                imageUrl: dbItem.imageUrl
            }                },
        { upsert: true},
        function(err, res) {
            if (err) {
                console.log('err: ' + err);
            }
        });
}
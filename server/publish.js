var Fiber = Meteor.npmRequire('fibers');

Meteor.publish('coverItems', function() {
   return CoverItems.find();
});

Meteor.publish('topItems', function(brand, category) {
   var categoryName = ProductCategory.properties[category].name;
   console.log("publish topItems, category: " + categoryName + ", brand: " + brand);

    // TODO(luping): add sortby and limit.
   var items = TopItems.find({ merchant: brand, productCategory: category});

   if (items.count() == 0) {
      Fiber(function() {
         // Async search on amazon and wait for the result from the fiber.
         var itemSearchRes = amznItemSearch(categoryName, brand);
         var itemArray = parseItemSearchRes(itemSearchRes);

         for (var i = 0; i < itemArray.length; i++) {

            var dbItem = {
               merchant: brand,
               productCategory: category,
            };

            var asin = parseItem(itemArray[i], dbItem);

            var imageSearchRes = amznItemLookup(asin);
            parseImageSearchRes(imageSearchRes, dbItem);

            TopItems.update(
                { _id: asin.toString()},
                {
                   $setOnInsert: dbItem
                },
                { upsert: true},
                function(err, res) {
                   if (err) {
                      console.log('err: ' + err);
                   }
                });
            Meteor._sleepForMs(200);
         }

         items = TopItems.find({ merchant: brand, productCategory: category});
      }).run();
   }
   return items;
});
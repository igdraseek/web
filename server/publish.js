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
              upsertItem(asin, dbItem, brand, category);
          }
      }).run();
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

var Fiber = Meteor.npmRequire('fibers');

Meteor.methods({
    'amznItemDetails': function(itemId) {
        // Look into collected items first.
        var dbItem = CollectedItems.findOne({_id: itemId});
        if (dbItem) {
            console.log("method amznItemDetails: found in CollectedItems " + itemId);
            return dbItem;
        }

        // Could be in topItems and not in any collections yet.
        dbItem = TopItems.findOne({_id: itemId});
        if (dbItem) {
            console.log("method amznItemDetails: found in TopItems" + itemId);
            return dbItem;
        }

        Fiber(function () {
            dbItem = {};
            var results = amznItemDetails(itemId);
            var jsonRes = results[0];
            var itemLookupRes = jsonRes['ItemLookupResponse'];
            var items = itemLookupRes['Items'][0];
            console.dir(items);
            var item = items['Item'][0];

            parseItem(item, dbItem);
            dbItem.imageUrl = getImageUrl(item);

            TopItems.update(
                { _id: itemId.toString()},
                {
                    $setOnInsert: {
                        //productCategory: category,
                        //productCategoryName: ProductCategory.properties[category].descriptiveName,
                        //merchant: brand,
                        detailUrl: dbItem.detailUrl,
                        title: dbItem.title,
                        feature: dbItem.features,
                        socialCategories: []
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
        }).run();

        return dbItem;
    },

    'createCollection': function(title) {
        var collectionId = null;
        var userId = this.userId;
        console.log('userId: ' + userId);
        Fiber(function() {
            collectionId = newUserCollection(userId, title);
            var newCollection = {
                collectionId: collectionId,
                title: title
            };

            Meteor.users.update(
                {
                    _id: userId
                },
                {
                    $push: {'profile.collections': newCollection}
                }
            );
        }).run();

        return collectionId;
    },

    'addToCollection': function(collectionId, item) {
        UserCollections.update(
            {_id: collectionId},
            {
                $addToSet: {items: item._id}
            },
            function (err, res) {
                if (err) {
                    console.log('err adding to UserCollections: ' + err);
                }
            });

        var oldItem = CollectedItems.findOne({_id: item._id});
        if (oldItem) {
            CollectedItems.update(
                {_id: item._id},
                {
                    $addToSet: {
                        socialCategories: {$each: item.socialCategories}
                    },
                    $currentDate: {
                      lastCollected: {$type: "timestamp"}
                    }
                },
                function (err, res) {
                    if (err) {
                        console.log('err: ' + err);
                    }
                });
        } else {
            CollectedItems.insert(item);
            CollectedItems.update(
                {_id: item._id},
                {
                    $currentDate: {
                        lastCollected: {$type: "timestamp"}
                    }
                },
                function (err, res) {
                    if (err) {
                        console.log('err: ' + err);
                    }
                });
        }
    }
});

var newUserCollection = function (userId, title) {
    var fiber = Fiber.current;

    UserCollections.insert(
        {
            creator: userId,
            title: title,
            items: []
        },
        function (err, res) {
            if (err) {
                console.error(err);
            } else {
                console.log("inserted new collection: " + res);
                fiber.run(res);
            }
        });

    return Fiber.yield();
};

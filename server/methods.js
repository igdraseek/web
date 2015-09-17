var Fiber = Meteor.npmRequire('fibers');

Meteor.methods({
    'amznItemLookup': function(itemId) {
        // Look into collected items first.
        var dbItem = CollectedItems.findOne({_id: itemId});
        if (dbItem) {
            console.log("method amznItemLookup: found in CollectedItems " + itemId);
            return dbItem;
        }

        // Could be in Items and not in any collections yet.
        dbItem = Items.findOne({_id: itemId});
        if (dbItem) {
            console.log("method amznItemLookup: found in Items" + itemId);
            return dbItem;
        }

        Fiber(function () {
            dbItem = {};
            var results = amznItemLookup(itemId);
            var items = parseItemLookupRes(results);
            var item = items[0];

            parseItem(item, dbItem);

            Items.update(
                { _id: itemId.toString()},
                {
                    $setOnInsert: {
                        //productCategory: category,
                        //productCategoryName: ProductCategory.properties[category].descriptiveName,
                        //merchant: brand,
                        detailUrl: dbItem.detailUrl,
                        title: dbItem.title,
                        price: dbItem.price,
                        isEligibleForPrime: dbItem.isEligibleForPrime,
                        feature: dbItem.features,
                        socialCategories: []
                    },
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
            Fiber(function() {
                var id = insertCollectedItem(item);
                CollectedItems.update(
                    {_id: id},
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
            }).run();
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

var insertCollectedItem = function (item) {
    var fiber = Fiber.current;

    CollectedItems.insert(
        item,
        function (err, res) {
            if (err) {
                console.error(err);
            } else {
                console.log("inserted new item: " + res);
                fiber.run(res);
            }
        });

    return Fiber.yield();
};

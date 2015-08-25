var Fiber = Meteor.npmRequire('fibers');

Meteor.methods({
    'amznItemDetails': function(itemId) {
        var dbItem = TopItems.findOne({_id: itemId});
        if (dbItem != null && dbItem != undefined) {
            console.log("found in TopItems");
            return dbItem;
        }
        dbItem = UserCollections.findOne({
            'creator': this.userId,
            'items._id': itemId
        });
        if (dbItem != null && dbItem != undefined) {
            console.log("found in UserCollections");
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
        var oldItem = UserCollections.findOne({
            _id: collectionId,
            'items._id': item._id
        });
        if (!oldItem) {
            console.log("adding to collection");
            UserCollections.update(
                {_id: collectionId},
                {
                    $push: {items: item}
                },
                function (err, res) {
                    if (err) {
                        console.log('err: ' + err);
                    }
                });
        } else {
            console.log("found item in UserCollection");
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

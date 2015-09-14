Iron.utils.debug = true;

Router.configure({
    trackPageView: true,
    layoutTemplate: 'appBody'
});

Router.map(function() {
 //   this.route('home', {path: '/'});

    this.route('igdraseek', {path: '/'});
    this.route('itemList/:category/brand/:brand', {
        loadingTemplate: 'loading',

        waitOn: function() {
            var brand = decodeURIComponent(this.params.brand);
            return Meteor.subscribe('itemsForBrand', brand, parseInt(this.params.category));
        },

        data: function () {
            var brand = decodeURIComponent(this.params.brand);
            var found = Items.find(
                {   merchant: brand,
                    productCategory: parseInt(this.params.category)
                });
            return {itemsForBrand: found};
        },

        action: function() {
            this.render('itemList');
        }
    });

    this.route('addCollection');

    this.route('collection/:_id', {
        loadingTemplate: 'loading',

        waitOn: function() {
            var collectionId = decodeURIComponent(this.params._id);
            return [
                Meteor.subscribe('userCollections', collectionId),
                Meteor.subscribe('collectedItems')];
        },

        data: function () {
            var collectionId = decodeURIComponent(this.params._id);
            if (this.ready()) {
                var collection = UserCollections.findOne({_id: collectionId});
                var itemIds = collection.items;
                console.log("itemIds in collection:");
                console.dir(itemIds);

                var items = CollectedItems.find({_id: {$in: itemIds}}).fetch();
                console.log("items found from CollectedItems");
                console.dir(items);

                return {
                    collectionId: collectionId,
                    collectionTitle: collection.title,

                    // TODO(luping): this sometime doesn't seem reactive, especially adding from
                    // amazon for the first time.
                    collectionItems: items
                };
            }
        },

        action: function() {
            this.render('collection');
        }
    });

    this.route('mock', {path: '/mock'})
});
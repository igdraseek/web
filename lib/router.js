Iron.utils.debug = true;

Router.configure({
    trackPageView: true,
    layoutTemplate: 'appBody'
});

Router.map(function() {
    this.route('igdraseek', {path: '/'});

    this.route('itemList/:category/merchant/:brand', {
        loadingTemplate: 'loading',

        waitOn: function() {
            var brand = decodeURIComponent(this.params.brand);
            return Meteor.subscribe('topItems', brand, parseInt(this.params.category));
        },

        data: function () {
            var brand = decodeURIComponent(this.params.brand);
            var found = TopItems.find(
                {   merchant: brand,
                    productCategory: parseInt(this.params.category)
                });
            return {topItems: found};
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
            return Meteor.subscribe('userCollections', collectionId);
        },

        data: function () {
            var collectionId = decodeURIComponent(this.params._id);
            if (this.ready()) {
                var collection = UserCollections.findOne({_id: collectionId});
                return {
                    collectionId: collectionId,
                    collectionTitle: collection.title,
                    collectionItems: collection.items
                };
            }
        },

        action: function() {
            this.render('collection');
        }
    });

    this.route('mock', {path: '/mock'})
});
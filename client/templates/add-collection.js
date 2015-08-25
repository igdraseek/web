Template.addCollection.helpers({
   collections: function () {
        return Meteor.user().profile['collections'];
    },

    newItem: function() {
        return Session.get('newItem');
    }
});

Template.addCollection.events({
    'input #newItem': _.throttle(function (e) {
        e.preventDefault();
        var url = e.target.value;
        console.log("text area:" + url);

        var startIndex = url.indexOf('/dp/');
        if (startIndex < 0) {
            startIndex = url.indexOf('/gp/product/')
            if (startIndex > 0) {
                startIndex += 12;
            }
        } else {
            startIndex += 4;
        }

        if (startIndex > 0) {
            var endIndex = url.indexOf('/', startIndex);
            if (endIndex > startIndex) {
                var asin = url.substring(startIndex, endIndex);
                console.log('asin: ' + asin);

                Meteor.call('amznItemDetails', asin, function(err, res) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("item returned by server: ");
                        console.dir(res);
                        Session.set('newItem', res);
                    }
                });
            }
        }

    }, 200),

    'submit form': function (e) {
        event.preventDefault();

        var title = $("#collectionTitle").val();
        if (!title) {
            console.log('need title');
            // TODO(luping): validate
            return;
        }

        Meteor.call('createCollection', title, function(err, res) {
            if (err) {
                console.error(err);
            } else {
                console.log("collection created: " + res);
            }
        })
    }
});

Template.collection.helpers({
    socialCategories: function() {
        return SOCIAL_RESP_CATEGORIES;
    },
    newItem: function() {
        return Session.get('newItem');
    }
});

Template.collection.events({
    'submit form': function (e) {
        event.preventDefault();

        var item = Session.get('newItem');
        if (item) {
            console.log("still have new item, adding it");
            var collectionId = $('input[name=collectionId]').val();
            console.log("hidden collectionId " + collectionId);

            var socialCategories = [];
            $('input[name=socialCategory]:checked').each(function() {
                socialCategories.push($(this).val());
            });

            item['socialResCateory'] = socialCategories;
            console.dir(item);

            Meteor.call('addToCollection', collectionId, item, function(err, res) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("added item to server");
                    Session.set("newItem", null);
                }
            });
        } else {
            console.log("newItem not found");
        }
    }
});
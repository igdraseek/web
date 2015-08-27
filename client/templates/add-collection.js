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
        var newItem = Session.get('newItem');
        var existingCategories = newItem['socialCategories'];

        var socialCategories = [];
        for (var i = 0; i < SOCIAL_RESP_CATEGORIES.length; i++) {
            var cat = SOCIAL_RESP_CATEGORIES[i];
            var name = cat.name;
            var value = cat.value;
            var checked = (_.contains(existingCategories, value));

            socialCategories.push({name: name, value: value, checked: checked});
        }

        console.log("social cat:");
        console.dir(socialCategories);

        return socialCategories;
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
            console.log("still have newItem, adding it");
            var collectionId = $('input[name=collectionId]').val();
            console.log("hidden collectionId " + collectionId);

            var socialCategories = [];
            $('input[name=socialCategory]:checked').each(function() {
                socialCategories.push(parseInt($(this).val()));
            });

            if (socialCategories.length == 0) {
                alert("You must select a social category before adding this item to the collection");
            }

            item['socialCategories'] = socialCategories;
            console.dir(item);

            Meteor.call('addToCollection', collectionId, item, function(err, res) {
                if (err) {
                    console.error("error adding to new collection: " + err);
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
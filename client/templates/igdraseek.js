Meteor.subscribe('merchants');

Template.igdraseek.helpers({
    coverItems: function () {
        // TODO(luping): use aggregate when Merchants database gets big.
        /* return Merchants.aggregate([
            {
                $project: {
                    _id: 0,
                    productCategory: 1,
                    brand: 1,
                    coverItem: 1
                }} ]);
        */
        return Merchants.find();
    }
});

Template.appBody.helpers({
    selectedItem: function() {
        return Session.get('selectedItem');
    }
});

Template.productDetail.events({
    'click .close': function (event) {
        console.log("close!");
        event.preventDefault();
        Session.set('selectedItem', null);
    }
});

Template.itemDetail.events({
   'click .listItem': function(event) {

       // prevent the default behavior
       event.preventDefault();

       Session.set('selectedItem', this);
   }
});
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

Template.itemList.helpers({
    selectedItem: function() {
        return Session.get('selectedItem');
    }
});

Template.itemList.events({
    'click .close': function (event) {
        console.log("close!");
        event.preventDefault();
        Session.set('selectedItem', null);
    }
});

Template.itemDetail.events({
   'click .listItem': function(event) {
       console.log("selected!");

       // prevent the default behavior
       event.preventDefault();

       Session.set('selectedItem', this);
       var item = Session.get('selectedItem');
       var price = item.price;
       console.log("price:");
       console.dir(price);
       console.log("formattedprice:");
       console.dir(price[0].FormattedPrice);
   }
});
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
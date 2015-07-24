var topCategories = [
    ProductCategory.APPAREL,
    ProductCategory.SHOES,
    ProductCategory.FASHION
];

Meteor.subscribe('coverItems');

Template.igdraseek.helpers({
    coverItems: function () {
        return CoverItems.find();
    }
});
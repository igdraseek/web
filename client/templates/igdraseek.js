Meteor.subscribe('coverItems');

Template.igdraseek.helpers({
    coverItems: function () {
        return CoverItems.find();
    }
});
Template.home.helpers({
  isMerchant: function() {
    if (Meteor.userId()) {
      return (Merchants.find({_id: Meteor.userId()}).count() > 0);
    }
    return false;
  },

  userName: function() {
    return Meteor.user().emails[0].address;
  }
});

Template.home.events({
  'click button': function () {
    Router.go('/setup');
  }
});

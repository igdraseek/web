

Template.setup.helpers({
    socialRespCat: function () {
        return SOCIAL_RESP_CATEGORY;
    }
});

Template.setup.events({
   'submit form' : function(event) {

       // stop the form from submitting
       event.preventDefault();

       // get the data we need from the form
       var newAccount = {
           _id: Meteor.userId(),
           bizName: $("#bizName").val(),
           phone: $("#phone").val(),
           street: $("#street").val(),
           city: $("#city").val(),
           state: $("#state").val(),
           zip: $("#zip").val(),
           storeWebsite: $("#storeWebsite").val(),
           emailForCustomer: $("#emailForCustomer").val(),
           storeNameOnIgdra: $("#storeNameOnIgdra").val(),
           aboutStore: $("#aboutStore").val(),
           srCategory: $("#srCategory").val()
       };

       if (Merchants.find({_id: Meteor.userId()}).count() == 0) {
           Merchants.insert(newAccount, function (err, insertedDocId) {
               if (err) {
                   console.log(err);
                   return;
               }
               console.log(insertedDocId);
           });
       } else {
           // TODO(luping): update the account instead of insert.
           console.log("account was already created: " + Meteor.userId());
       }

       Router.go('addProduct');
   }
});
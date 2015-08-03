Merchants = new Mongo.Collection("merchants");
TopItems = new Mongo.Collection("topItems");
CoverItems = new Mongo.Collection("coverItems");

if(Meteor.isServer) {
    TopItems._ensureIndex({
        merchant: 1,
        title: 1,
        productCategoryName: 1
    });
}

// Enum definition for social categories
SociallyResponsibleCategory = {
    LOCAL: 1,
    SUSTAINABLE: 2,
    WOMEN_OWNED: 3,
    VETERAN: 4,
    DISABLED_OWNED: 5,
    HUB: 6,
    ORGANIC: 7,
    ONE_FOR_ONE: 8,
    UPCYCLER: 9,

    properties: {
        1: {name: 'Local', value: 1},
        2: {name: 'Sustainable', value: 2},
        3: {name: 'Women Owned', value: 3},
        4: {name: 'Veteran', value: 4},
        5: {name: 'Disabled Owned', value: 5},
        6: {name: 'Low Income Neighborhood', value: 6},
        7: {name: 'Organic', value: 7},
        8: {name: 'One for one', value: 8},
        9: {name: 'Upcycler', value: 9}
    }
};

// Enum definition for certificates
Certificates = {
    GGA: 1,
    GOTS: 2,

    properties: {
        1: {name: 'Gold Green America', value: 1},
        2: {name: 'Global Organic Textile Standard', value: 2}
    }
};

// Enum definition for product categories
ProductCategory = {
    APPAREL: 1,
    FASHION: 2,
    LUGGAGE: 3,
    SHOES: 4,

    properties: {
        1: {name: "Apparel", descriptiveName: 'Apparel', value: 1, amznBrowseNode: 1036592},
        2: {name: "Fashion", descriptiveName: 'Fashion', value: 2, amznBrowseNode: 0},
        3: {name: "Luggage", descriptiveName: 'Luggage & Travel', value: 3, amznBrowseNode: 0},
        4: {name: "Shoes", descriptiveName: 'Shoes', value: 4, amznBrowseNode:672124011}
    }
};
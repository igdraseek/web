/**
 * Merchants verified by igdra.
 */
Merchants = new Mongo.Collection("merchants");

/**
 * An item representing a product looks like:
 * { _id: asin,
     productCategory: category,
     productCategoryName: ProductCategory.properties[category].descriptiveName,
     merchant: brand_from_Merchant,
     detailUrl: detailUrl,  // pointing to detail page on amazon
     title: title,
     feature: // features from amazon
        {
        }
     imageUrl: dbItem.imageUrl  // using the medium image right now. might want to switch to large
     }
*/

/**
 * TODO(luping): replace with Trending/New/Popular items.
 */
TopItems = new Mongo.Collection("topItems");

/**
 * Items that are added by users to their collections.
 * Each document is an item representing a product.
 * Keep these in a separate database because we want to keep them permanently
 * until user deletes the item AND the item no longer belongs to other collections.
 */
CollectedItems = new Mongo.Collection("collectedItems");

/**
 * Collections created by user. Each document is a collection:
 * {
 *     _id: generated,
 *     creator: creator_userid,
 *     title: name_of_collection,
 *     desc: optional_user_description,
 *     items: [asin1, aisn2, asin3...]
 * }
 */
UserCollections = new Mongo.Collection(("userCollections"));

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

// An array of the social category. This is for easy of use in the template.
SOCIAL_RESP_CATEGORIES = [
    SociallyResponsibleCategory.properties["1"],
    SociallyResponsibleCategory.properties["2"],
    SociallyResponsibleCategory.properties["3"],
    SociallyResponsibleCategory.properties["4"],
    SociallyResponsibleCategory.properties["5"],
    SociallyResponsibleCategory.properties["6"],
    SociallyResponsibleCategory.properties["7"],
    SociallyResponsibleCategory.properties["8"],
    SociallyResponsibleCategory.properties["9"]
];

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
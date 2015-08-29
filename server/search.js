SearchSource.defineSource('items', function(searchText, options) {
    if(searchText) {
        var regExp = buildRegExp(searchText);

        var selector = {$or: [
            {merchant: regExp},
            {title: regExp},
            {productCategoryName: regExp}
        ]};

        return Items.find(selector, options).fetch();
    } else {
        console.log('NO SEARCH TEXT');
        return Items.find({}, options).fetch();
    }
});

function buildRegExp(searchText) {
    var words = searchText.trim().split(/[ \-\:]+/);
    var exps = _.map(words, function(word) {
        return "(?=.*" + word + ")";
    });
    var fullExp = exps.join('') + ".+";
    return new RegExp(fullExp, "i");
}
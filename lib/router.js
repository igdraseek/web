Iron.utils.debug = true;

Router.configure({
    trackPageView: true,
    layoutTemplate: 'appBody'
});

Router.map(function() {
    this.route('home', {path: '/'});
    this.route('setup');
    this.route('addProduct');
});
Iron.utils.debug = true;

Router.configure({
    trackPageView: true,
    layoutTemplate: 'appBody'
});

Router.map(function() {
    this.route('igdraseek', {path: '/'});
    this.route('setup');
    this.route('addProduct');

    this.route('mock', {path: '/mock'})
});
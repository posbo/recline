define(['backbone'], function ( Backbone ) {
    return Backbone.Model.extend({
        constructor: function Facet() {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        defaults: function() {
            return {
                _type: 'terms',
                total: 0,
                other: 0,
                missing: 0,
                terms: []
            };
        }
    });
});

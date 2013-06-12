define(['backbone','src/model.facet'], function ( Backbone, Facet ) {
    return Backbone.Collection.extend({
        constructor: function FacetList() {
            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },
        model: Facet
    });
});

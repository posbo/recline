define(['backbone','src/model.field'], function ( Backbone, Field ) {
    return Backbone.Collection.extend({
        constructor: function FieldList() {
            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },
        model: Field
    });
});

define(['backbone','src/model.record'], function ( Backbone, Record ) {
    return Backbone.Collection.extend({
        constructor: function RecordList() {
            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },
        model: Record
    });
});

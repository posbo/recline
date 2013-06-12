define(['backbone'], function ( Backbone ) {
    return Backbone.Model.extend({
        constructor: function Query() {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        defaults: function() {
            return {
                size: 100,
                from: 0,
                q: '',
                facets: {},
                filters: []
            };
        },
        _filterTemplates: {
            term: {
                type: 'term',
                // TODO do we need this attribute here?
                field: '',
                term: ''
            },
            range: {
                type: 'range',
                start: '',
                stop: ''
            },
            geo_distance: {
                type: 'geo_distance',
                distance: 10,
                unit: 'km',
                point: {
                    lon: 0,
                    lat: 0
                }
            }
        },
        // ### addFilter(filter)
        //
        // Add a new filter specified by the filter hash and append to the list of filters
        //
        // @param filter an object specifying the filter - see _filterTemplates for examples. If only type is provided will generate a filter by cloning _filterTemplates
        addFilter: function(filter) {
            // crude deep copy
            var ourfilter = JSON.parse(JSON.stringify(filter));
            // not fully specified so use template and over-write
            if (_.keys(filter).length <= 3) {
            ourfilter = _.defaults(ourfilter, this._filterTemplates[filter.type]);
            }
            var filters = this.get('filters');
            filters.push(ourfilter);
            this.trigger('change:filters:new-blank');
        },
        updateFilter: function(index, value) {
        },
        // ### removeFilter
        //
        // Remove a filter from filters at index filterIndex
        removeFilter: function(filterIndex) {
            var filters = this.get('filters');
            filters.splice(filterIndex, 1);
            this.set({filters: filters});
            this.trigger('change');
        },
        // ### addFacet
        //
        // Add a Facet to this query
        //
        // See <http://www.elasticsearch.org/guide/reference/api/search/facets/>
        addFacet: function(fieldId) {
            var facets = this.get('facets');
            // Assume id and fieldId should be the same (TODO: this need not be true if we want to add two different type of facets on same field)
            if (_.contains(_.keys(facets), fieldId)) {
            return;
            }
            facets[fieldId] = {
            terms: { field: fieldId }
            };
            this.set({facets: facets}, {silent: true});
            this.trigger('facet:add', this);
        },
        addHistogramFacet: function(fieldId) {
            var facets = this.get('facets');
            facets[fieldId] = {
            date_histogram: {
                field: fieldId,
                interval: 'day'
            }
            };
            this.set({facets: facets}, {silent: true});
            this.trigger('facet:add', this);
        }
    });
});

define([
    'backbone',
    '../collection/fieldList',
    '../collection/recordList',
    '../collection/facetList',
    './facet',
    './record',
    './query'
], function ( Backbone, FieldList, RecordList, Facet, Query ) {

    "use strict";

    var Deferred = ( typeof jQuery !== "undefined" && jQuery.Deferred ) || _.Deferred;

    return Backbone.Model.extend({
        constructor: function Dataset() {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        initialize: function() {
            var self = this;
            _.bindAll(this, 'query');

            this.backend = null;

            if ( this.get('backend') ) {
                this.backend = this._backendFromString(this.get('backend'));
            } else { // try to guess backend ...
                if ( this.get('records')) {
                    this.backend = recline.Backend.Memory;
                }
            }

            this.fields = new FieldList();
            this.records = new RecordList();

            this._changes = {
                deletes: [],
                updates: [],
                creates: []
            };

            this.facets = new FacetList();
            this.recordCount = null;
            this.queryState = new Query();

            this.queryState.bind('change facet:add', function () {
                self.query(); // We want to call query() without any arguments.
            });
            // store is what we query and save against
            // store will either be the backend or be a memory store if Backend fetch
            // tells us to use memory store
            this._store = this.backend;
            if (this.backend === recline.Backend.Memory) {
                this.fetch();
            }
        },
        fetch: function() {
            var self = this;
            var dfd = new Deferred();

            if (this.backend !== recline.Backend.Memory) {
                this.backend.fetch(this.toJSON())
                    .done(handleResults)
                    .fail(function(args) {
                        dfd.reject(args);
                    });
            } else {
                // special case where we have been given data directly
                handleResults({
                    records: this.get('records'),
                    fields: this.get('fields'),
                    useMemoryStore: true
                });
            }

            function handleResults(results) {
            // if explicitly given the fields
            // (e.g. var dataset = new Dataset({fields: fields, ...})
            // use that field info over anything we get back by parsing the data
            // (results.fields)
            var fields = self.get('fields') || results.fields;

            var out = self._normalizeRecordsAndFields(results.records, fields);
            if (results.useMemoryStore) {
                self._store = new recline.Backend.Memory.Store(out.records, out.fields);
            }

            self.set(results.metadata);
            self.fields.reset(out.fields);
            self.query()
                .done(function() {
                dfd.resolve(self);
                })
                .fail(function(args) {
                dfd.reject(args);
                });
            }

            return dfd.promise();
        },
        /**
        * Get a proper set of fields and records from incoming set of fields
        * and records either of which may be null or arrays or objects
        *
        * @param {object} records
        * @param {object} fields
        * @todo decide whether to keep orignal name as label { id: fieldId, label: field || fieldId }
        * @example
        *   fields = ['a', 'b', 'c'] and records = [ [1,2,3] ]
        *   fields = [ {id: a}, {id: b}, {id: c}], records = [ {a: 1}, {b: 2}, {c: 3}]
        */
        _normalizeRecordsAndFields: function(records, fields) {
            // if no fields get them from records
            if (!fields && records && records.length > 0) {
            // records is array then fields is first row of records ...
                if (records[0] instanceof Array) {
                    fields = records[0];
                    records = records.slice(1);
                } else {
                    fields = _.map(_.keys(records[0]), function(key) {
                        return {id: key};
                    });
                }
            }
            // fields is an array of strings (i.e. list of field headings/ids)
            if (fields && fields.length > 0 && (fields[0] === null || typeof(fields[0]) !== 'object')) {
            // Rename duplicate fieldIds as each field name needs to be unique.
             var seen = {};
            fields = _.map(fields, function(field, index) {
                if (field === null) {
                field = '';
                } else {
                field = field.toString();
                }
                // cannot use trim as not supported by IE7
                var fieldId = field.replace(/^\s+|\s+$/g, '');
                if (fieldId === '') {
                    fieldId = '_noname_';
                    field = fieldId;
                }
                while (fieldId in seen) {
                    seen[field] += 1;
                    fieldId = field + seen[field];
                }
                if (!(field in seen)) {
                    seen[field] = 0;
                }
                return { id: fieldId };
            });
            }
            // records is provided as arrays so need to zip together with fields
            // NB: this requires you to have fields to match arrays
            if (records && records.length > 0 && records[0] instanceof Array) {
                records = _.map(records, function(doc) {
                    var tmp = {};
                    _.each(fields, function(field, idx) {
                        tmp[field.id] = doc[idx];
                    });
                    return tmp;
                });
                }

            return {
                fields: fields,
                records: records
            };
        },
        save: function() {
            var self = this;
            // TODO: need to reset the changes ...
            return this._store.save(this._changes, this.toJSON());
        },

  // ### query
  //
  // AJAX method with promise API to get records from the backend.
  //
  // It will query based on current query state (given by this.queryState)
  // updated by queryObj (if provided).
  //
  // Resulting RecordList are used to reset this.records and are
  // also returned.
        query: function(queryObj) {
            var self = this,
                dfd = new Deferred();

            this.trigger('query:start');

            if ( queryObj ) {
                this.queryState.set(queryObj, {silent: true});
            }
            var actualQuery = this.queryState.toJSON();

            this._store.query(actualQuery, this.toJSON())
            .done(function(queryResult) {
                self._handleQueryResult(queryResult);
                self.trigger('query:done');
                dfd.resolve(self.records);
            })
            .fail(function(args) {
                self.trigger('query:fail', args);
                dfd.reject(args);
            });
            return dfd.promise();
        },
        _handleQueryResult: function(queryResult) {
            var self = this;
            self.recordCount = queryResult.total;
            var docs = _.map(queryResult.hits, function(hit) {
            var _doc = new Record( hit );
            _doc.fields = self.fields;
            _doc.bind('change', function(doc) {
                self._changes.updates.push(doc.toJSON());
            });
            _doc.bind('destroy', function(doc) {
                self._changes.deletes.push(doc.toJSON());
            });
            return _doc;
            });
            self.records.reset(docs);
            if (queryResult.facets) {
            var facets = _.map(queryResult.facets, function(facetResult, facetId) {
                facetResult.id = facetId;
                return new Facet(facetResult);
            });
            self.facets.reset(facets);
            }
        },
        toTemplateJSON: function() {
            var data = this.toJSON();
            data.recordCount = this.recordCount;
            data.fields = this.fields.toJSON();
            return data;
        },

        // ### getFieldsSummary
        //
        // Get a summary for each field in the form of a `Facet`.
        //
        // @return null as this is async function. Provides deferred/promise interface.
        getFieldsSummary: function() {
            var self = this;
            var query = new Query();
            query.set({size: 0});
            this.fields.each(function(field) {
            query.addFacet(field.id);
            });
            var dfd = new Deferred();
            this._store.query(query.toJSON(), this.toJSON()).done(function(queryResult) {
            if (queryResult.facets) {
                _.each(queryResult.facets, function(facetResult, facetId) {
                facetResult.id = facetId;
                var facet = new Facet(facetResult);
                // TODO: probably want replace rather than reset (i.e. just replace the facet with this id)
                self.fields.get(facetId).facets.reset(facet);
                });
            }
            dfd.resolve(queryResult);
            });
            return dfd.promise();
        },
        // Deprecated (as of v0.5) - use record.summary()
        recordSummary: function(record) {
            return record.summary();
        },
        // ### _backendFromString(backendString)
        //
        // Look up a backend module from a backend string (look in recline.Backend)
        _backendFromString: function(backendString) {
            var backend = null;
            if (recline && recline.Backend) {
            _.each(_.keys(recline.Backend), function(name) {
                if (name.toLowerCase() === backendString.toLowerCase()) {
                backend = recline.Backend[name];
                }
            });
            }
            return backend;
        }
    });
});

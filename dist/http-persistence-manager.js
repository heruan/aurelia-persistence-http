"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var aurelia_dependency_injection_1 = require("aurelia-dependency-injection");
var aurelia_persistence_1 = require("aurelia-persistence");
var aurelia_http_client_1 = require("aurelia-http-client");
var aurelia_http_utils_1 = require("aurelia-http-utils");
var aurelia_json_1 = require("aurelia-json");
var UrlTemplate = require("url-template");
var HttpPersistenceManager = (function () {
    function HttpPersistenceManager(httpClient) {
        this.filterHeaderName = "X-Filter";
        this.limitHeaderName = "X-Limit";
        this.skipHeaderName = "X-Skip";
        this.sortingHeaderName = "X-Sort";
        this.propertyFilterHeaderName = "X-Property-Filter";
        this.propertyFilterSeparator = ",";
        this.collectionRelation = "list";
        this.entityRelation = "self";
        this.countRelation = "count";
        this.identityProperty = "@id";
        this.httpClient = httpClient;
        this.linkHeaderParser = new aurelia_http_utils_1.LinkHeaderParser();
        this.relations = new Map();
    }
    HttpPersistenceManager.prototype.setCollectionRelation = function (relation) {
        this.collectionRelation = relation;
    };
    HttpPersistenceManager.prototype.setEntityRelation = function (relation) {
        this.entityRelation = relation;
    };
    HttpPersistenceManager.prototype.setCountRelation = function (relation) {
        this.countRelation = relation;
    };
    HttpPersistenceManager.prototype.setIdentityProperty = function (property) {
        this.identityProperty = property;
    };
    HttpPersistenceManager.prototype.identify = function (entity) {
        return entity.hasOwnProperty(this.identityProperty) ? entity[this.identityProperty] : null;
    };
    HttpPersistenceManager.prototype.addEntityType = function (type, location) {
        var _this = this;
        return this.httpClient.options(location).then(function (success) {
            // let linkHeader = success.headers.get(HttpHeaders.LINK);
            // let relations = this.linkHeaderParser.parse(linkHeader.split(","));
            // FIXME should be as above when this gets fixed: https://github.com/aurelia/http-client/issues/128
            var relations = new Map();
            var links = success.content["links"];
            Object.keys(links).forEach(function (rel) { return relations.set(rel, links[rel]); });
            _this.relations.set(type, relations);
        });
    };
    HttpPersistenceManager.prototype.findAll = function (type, query, limit, skip, sorting, properties) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (sorting === void 0) { sorting = new aurelia_persistence_1.Sorting(); }
        var url = this.link(type, this.collectionRelation);
        var requestBuilder = this.httpClient.createRequest(url).asGet();
        requestBuilder.withHeader(this.filterHeaderName, JSON.stringify(query))
            .withHeader(this.limitHeaderName, "" + limit)
            .withHeader(this.skipHeaderName, "" + skip)
            .withHeader(this.sortingHeaderName, JSON.stringify(sorting));
        if (Array.isArray(properties)) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(this.propertyFilterSeparator));
        }
        var request = requestBuilder.send();
        var promise = request.then(function (success) { return success.content; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.findOne = function (type, query, skip, sorting, properties) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (skip === void 0) { skip = 0; }
        if (sorting === void 0) { sorting = new aurelia_persistence_1.Sorting(); }
        var entities = this.findAll(type, query, 1, skip, sorting, properties);
        var promise = entities.then(function (entities) { return entities.length > 0 ? entities.shift() : null; });
        promise.cancel = entities.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.count = function (type, query, limit, skip) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        var url = this.link(type, this.countRelation);
        var request = this.httpClient.createRequest(url)
            .asGet()
            .withHeader(this.filterHeaderName, JSON.stringify(query))
            .withHeader(this.limitHeaderName, JSON.stringify(limit))
            .withHeader(this.skipHeaderName, JSON.stringify(skip))
            .send();
        var promise = request.then(function (success) { return success.content; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.get = function (type, params, properties) {
        var url = this.link(type, this.entityRelation, params);
        var requestBuilder = this.httpClient.createRequest(url).asGet();
        if (properties) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(","));
        }
        var request = requestBuilder.send();
        var promise = request.then(function (success) { return success.content; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.save = function (type, entity, data) {
        var _this = this;
        var request;
        var location;
        var url = this.link(type, this.entityRelation, entity);
        if (data instanceof FormData || this.identify(entity) === null) {
            var url_1 = this.link(type, this.collectionRelation);
            request = this.httpClient.createRequest(url_1).asPost().withContent(data ? data : entity).send();
            location = request.then(function (success) { return success.headers.get(aurelia_http_utils_1.HttpHeaders.LOCATION); });
        }
        else if (data instanceof aurelia_json_1.JsonPatch || Array.isArray(data)) {
            var url_2 = this.link(type, this.entityRelation, entity);
            request = this.httpClient.createRequest(url_2).asPatch()
                .withHeader(aurelia_http_utils_1.HttpHeaders.CONTENT_TYPE, aurelia_http_utils_1.MediaType.APPLICATION_JSON_PATCH)
                .withContent(data).send();
            location = request.then(function (success) { return url_2; });
        }
        else {
            var url_3 = this.link(type, this.entityRelation, entity);
            request = this.httpClient.createRequest(url_3).asPut().withContent(entity).send();
            location = request.then(function (success) { return url_3; });
        }
        var retrieve = location.then(function (url) { return _this.httpClient.createRequest(url).asGet().send(); });
        var promise = retrieve.then(function (success) { return success.content; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.delete = function (type, entity) {
        var url = this.link(type, this.entityRelation, entity);
        var request = this.httpClient.createRequest(url).asDelete().send();
        var promise = request.then(function (success) { return null; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.link = function (type, relation, params) {
        return UrlTemplate.parse(this.relations.get(type).get(relation)).expand(params);
    };
    HttpPersistenceManager = __decorate([
        aurelia_dependency_injection_1.autoinject, 
        __metadata('design:paramtypes', [aurelia_http_client_1.HttpClient])
    ], HttpPersistenceManager);
    return HttpPersistenceManager;
}());
exports.HttpPersistenceManager = HttpPersistenceManager;

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
var type_binder_1 = require("type-binder");
var UrlTemplate = require("url-template");
aurelia_http_client_1.RequestBuilder.addHelper("asCount", function () { return function (client, processor, message) {
    message.method = 'COUNT';
}; });
var HttpPersistenceManager = HttpPersistenceManager_1 = (function () {
    function HttpPersistenceManager(httpClient, typeBinder) {
        this.filterHeaderName = "X-Filter";
        this.limitHeaderName = "X-Limit";
        this.skipHeaderName = "X-Skip";
        this.sortHeaderName = "X-Sort";
        this.propertyFilterHeaderName = "X-Property-Filter";
        this.countTotalHeaderName = "X-Count-Total";
        this.countFilterHeaderName = "X-Count-Filter";
        this.propertyFilterSeparator = ",";
        this.httpClient = httpClient;
        this.typeBinder = typeBinder;
        this.locators = new Map();
    }
    HttpPersistenceManager.prototype.addEntityType = function (type, baseUri, collectionPath, entityPath) {
        var locators = new Map();
        locators.set(HttpPersistenceManager_1.BASE_URI, baseUri);
        locators.set(HttpPersistenceManager_1.COLLECTION_RELATION, baseUri + collectionPath);
        locators.set(HttpPersistenceManager_1.ENTITY_RELATION, baseUri + entityPath);
        this.locators.set(type, locators);
        return Promise.resolve();
    };
    HttpPersistenceManager.prototype.findAll = function (type, query, limit, skip, sorting, properties, relation, relationParams) {
        var _this = this;
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (sorting === void 0) { sorting = new aurelia_persistence_1.Sorting(); }
        if (relation === void 0) { relation = HttpPersistenceManager_1.COLLECTION_RELATION; }
        var url = this.link(type, relation, relationParams);
        var requestBuilder = this.httpClient.createRequest(url).asGet();
        requestBuilder.withHeader(this.filterHeaderName, JSON.stringify(query))
            .withHeader(this.limitHeaderName, "" + limit)
            .withHeader(this.skipHeaderName, "" + skip)
            .withHeader(this.sortHeaderName, JSON.stringify(sorting));
        if (Array.isArray(properties)) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(this.propertyFilterSeparator));
        }
        var request = requestBuilder.send();
        var promise = request.then(function (success) { return _this.typeBinder.bind(success.content, Array, type); });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.findOne = function (type, query, skip, sorting, properties, relation, relationParams) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (skip === void 0) { skip = 0; }
        if (sorting === void 0) { sorting = new aurelia_persistence_1.Sorting(); }
        if (relation === void 0) { relation = HttpPersistenceManager_1.COLLECTION_RELATION; }
        var entities = this.findAll(type, query, 1, skip, sorting, properties, relation, relationParams);
        var promise = entities.then(function (entities) {
            if (entities.length > 0) {
                return entities.shift();
            }
            else
                throw new Error("Entity not found.");
        });
        promise.cancel = entities.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.count = function (type, query, limit, skip, relation, relationParams) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (relation === void 0) { relation = HttpPersistenceManager_1.COLLECTION_RELATION; }
        if (relationParams === void 0) { relationParams = {}; }
        var url = this.link(type, relation, relationParams);
        return this.httpCount(url, query, limit, skip);
    };
    HttpPersistenceManager.prototype.httpCount = function (url, query, limit, skip) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        var request = this.httpClient.createRequest(url)
            .asCount()
            .withHeader(this.filterHeaderName, JSON.stringify(query))
            .withHeader(this.limitHeaderName, JSON.stringify(limit))
            .withHeader(this.skipHeaderName, JSON.stringify(skip))
            .send();
        var promise = request.then(function (success) { return success.content; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.get = function (type, params, properties, relation) {
        if (relation === void 0) { relation = HttpPersistenceManager_1.ENTITY_RELATION; }
        var url = this.link(type, relation, params);
        return this.httpGet(url, properties, type);
    };
    HttpPersistenceManager.prototype.httpGet = function (url, properties, type) {
        var _this = this;
        var generics = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            generics[_i - 3] = arguments[_i];
        }
        var requestBuilder = this.httpClient.createRequest(url).asGet();
        if (properties) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(","));
        }
        var request = requestBuilder.send();
        var promise = request.then(function (success) { return _this.typeBinder.bind(success.content, type); });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.save = function (type, entity, relation, relationParams) {
        var _this = this;
        var promise;
        if (this.typeBinder.isBound(type, entity)) {
            var patch = aurelia_json_1.JsonPatch.diff(entity);
            if (patch.length > 0) {
                var url_1 = this.link(type, relation || HttpPersistenceManager_1.ENTITY_RELATION, relationParams || entity);
                promise = this.httpClient.createRequest(url_1)
                    .asPatch()
                    .withContent(patch)
                    .withInterceptor(new aurelia_json_1.JsonMultipartRelatedInterceptor(aurelia_http_utils_1.ContentType.APPLICATION_JSON_PATCH))
                    .send()
                    .then(function (success) { return _this.httpClient.get(url_1); })
                    .then(function (success) { return _this.typeBinder.bind(success.content, type); });
            }
            else {
                promise = Promise.resolve(entity);
                promise.cancel = function () { };
            }
        }
        else {
            var url = this.link(type, relation || HttpPersistenceManager_1.COLLECTION_RELATION, relationParams || entity);
            promise = this.httpClient.createRequest(url)
                .asPost()
                .withContent(entity)
                .withInterceptor(new aurelia_json_1.JsonMultipartRelatedInterceptor(aurelia_http_utils_1.ContentType.APPLICATION_JSON))
                .send()
                .then(function (success) { return _this.httpClient.get(aurelia_http_utils_1.HttpHeaders.LOCATION); })
                .then(function (success) { return _this.typeBinder.bind(success.content, type); });
        }
        return promise;
    };
    HttpPersistenceManager.prototype.delete = function (type, entity, relation, relationParams) {
        if (relation === void 0) { relation = HttpPersistenceManager_1.ENTITY_RELATION; }
        var url = this.link(type, relation, relationParams || entity);
        var request = this.httpClient.createRequest(url).asDelete().send();
        var promise = request.then(function (success) { return null; });
        promise.cancel = request.cancel;
        return promise;
    };
    HttpPersistenceManager.prototype.link = function (type, relation, params) {
        return UrlTemplate.parse(this.locators.get(type).get(relation)).expand(params);
    };
    return HttpPersistenceManager;
}());
HttpPersistenceManager.BASE_URI = "base";
HttpPersistenceManager.ENTITY_RELATION = "entity";
HttpPersistenceManager.COLLECTION_RELATION = "list";
HttpPersistenceManager = HttpPersistenceManager_1 = __decorate([
    aurelia_dependency_injection_1.autoinject,
    __metadata("design:paramtypes", [aurelia_http_client_1.HttpClient, type_binder_1.TypeBinder])
], HttpPersistenceManager);
exports.HttpPersistenceManager = HttpPersistenceManager;
var HttpPersistenceManager_1;

//# sourceMappingURL=http-persistence-manager.js.map

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
Object.defineProperty(exports, "__esModule", { value: true });
var aurelia_dependency_injection_1 = require("aurelia-dependency-injection");
var http_persistence_manager_1 = require("./http-persistence-manager");
var aurelia_persistence_1 = require("aurelia-persistence");
var HttpEntityService = (function () {
    function HttpEntityService(persistenceManager, entityType) {
        this.collectionRelation = "list";
        this.entityRelation = "self";
        this.countRelation = "count";
        this.persistenceManager = persistenceManager;
        this.entityType = entityType;
    }
    HttpEntityService.prototype.findAll = function (query, limit, skip, sorting, properties) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        if (sorting === void 0) { sorting = new aurelia_persistence_1.Sorting(); }
        return this.persistenceManager.findAll(this.getEntityType(), query, limit, skip, sorting, properties);
    };
    HttpEntityService.prototype.findOne = function (query, skip, sorting, properties) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (skip === void 0) { skip = 0; }
        if (sorting === void 0) { sorting = new aurelia_persistence_1.Sorting(); }
        return this.persistenceManager.findOne(this.getEntityType(), query, skip, sorting, properties);
    };
    HttpEntityService.prototype.count = function (query, limit, skip) {
        if (query === void 0) { query = new aurelia_persistence_1.FilterQuery(); }
        if (limit === void 0) { limit = 0; }
        if (skip === void 0) { skip = 0; }
        return this.persistenceManager.count(this.getEntityType(), query, limit, skip);
    };
    HttpEntityService.prototype.get = function (params, properties) {
        return this.persistenceManager.get(this.getEntityType(), params, properties);
    };
    HttpEntityService.prototype.save = function (entity, properties) {
        return this.persistenceManager.save(this.getEntityType(), entity, properties);
    };
    HttpEntityService.prototype.delete = function (entity) {
        return this.persistenceManager.delete(this.getEntityType(), entity, http_persistence_manager_1.HttpPersistenceManager.ENTITY_RELATION, this.getParamsFromEntity(entity));
    };
    HttpEntityService.prototype.getParamsFromEntity = function (entity) {
        return entity;
    };
    HttpEntityService.prototype.getEntityType = function () {
        return this.entityType;
    };
    return HttpEntityService;
}());
HttpEntityService = __decorate([
    aurelia_dependency_injection_1.autoinject,
    __metadata("design:paramtypes", [http_persistence_manager_1.HttpPersistenceManager, Function])
], HttpEntityService);
exports.HttpEntityService = HttpEntityService;

//# sourceMappingURL=http-entity-service.js.map

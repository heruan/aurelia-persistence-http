import {autoinject} from "aurelia-dependency-injection";
import {CancelablePromise} from "aurelia-utils";
import {HttpPersistenceManager} from "./http-persistence-manager";
import {EntityService, FilterQuery, Query, Sorting} from "aurelia-persistence";

@autoinject
export abstract class HttpEntityService<E extends Object> implements EntityService<E> {

    protected persistenceManager: HttpPersistenceManager;

    protected entityType: new() => E;

    public collectionRelation: string = "list";

    public entityRelation: string = "self";

    public countRelation: string = "count";

    public constructor(persistenceManager: HttpPersistenceManager, entityType: new() => E) {
        this.persistenceManager = persistenceManager;
        this.entityType = entityType;
        this.collectionRelation = this.persistenceManager.collectionRelation;
        this.entityRelation = this.persistenceManager.entityRelation;
        this.countRelation = this.persistenceManager.countRelation;
    }

    public findAll(query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, sorting: Sorting = new Sorting(), properties?: string[], relation: string = this.collectionRelation): CancelablePromise<E[]> {
        return this.persistenceManager.findAll<E, E>(this.getEntityType(), query, limit, skip, sorting, properties, relation);
    }

    public findOne(query: Query = new FilterQuery(), skip: number = 0, sorting: Sorting = new Sorting(), properties?: string[], relation: string = this.collectionRelation): CancelablePromise<E> {
        return this.persistenceManager.findOne<E, E>(this.getEntityType(), query, skip, sorting, properties, relation);
    }

    public count(query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, relation: string = this.countRelation): CancelablePromise<number> {
        return this.persistenceManager.count<E>(this.getEntityType(), query, limit, skip, relation);
    }

    public get(params: Object, properties?: string[], relation: string = this.entityRelation): CancelablePromise<E> {
        return this.persistenceManager.get<E, E>(this.getEntityType(), params, properties, relation);
    }

    public save<D>(entity: E, data?: D, relation?: string): CancelablePromise<E> {
        return this.persistenceManager.save<E, D, E>(this.getEntityType(), entity, data, relation, this.getParamsFromEntity(entity));
    }

    public delete(entity: E, relation: string = this.entityRelation): CancelablePromise<void> {
        return this.persistenceManager.delete<E>(this.getEntityType(), entity, relation, this.getParamsFromEntity(entity));
    }

    protected getParamsFromEntity(entity: E): Object {
        return entity;
    }

    protected getEntityType(): new() => E {
        return this.entityType;
    }

}

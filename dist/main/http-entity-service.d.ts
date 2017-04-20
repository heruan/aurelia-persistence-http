import { CancelablePromise } from "aurelia-utils";
import { HttpPersistenceManager } from "./http-persistence-manager";
import { EntityService, Query, Sorting } from "aurelia-persistence";
export declare abstract class HttpEntityService<E extends Object> implements EntityService<E> {
    protected persistenceManager: HttpPersistenceManager;
    protected entityType: new () => E;
    collectionRelation: string;
    entityRelation: string;
    countRelation: string;
    constructor(persistenceManager: HttpPersistenceManager, entityType: new () => E);
    findAll(query?: Query, limit?: number, skip?: number, sorting?: Sorting, properties?: string[]): CancelablePromise<E[]>;
    findOne(query?: Query, skip?: number, sorting?: Sorting, properties?: string[]): CancelablePromise<E>;
    count(query?: Query, limit?: number, skip?: number): CancelablePromise<number>;
    get(params: Object, properties?: string[]): CancelablePromise<E>;
    save(entity: E, properties?: string[]): CancelablePromise<E>;
    delete(entity: E): CancelablePromise<void>;
    protected getParamsFromEntity(entity: E): Object;
    protected getEntityType(): new () => E;
}

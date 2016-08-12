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
    findAll(query?: Query, limit?: number, skip?: number, sorting?: Sorting, properties?: string[], relation?: string): CancelablePromise<E[]>;
    findOne(query?: Query, skip?: number, sorting?: Sorting, properties?: string[], relation?: string): CancelablePromise<E>;
    count(query?: Query, limit?: number, skip?: number, relation?: string): CancelablePromise<number>;
    get(params: Object, properties?: string[], relation?: string): CancelablePromise<E>;
    save<D>(entity: E, data?: D, relation?: string): CancelablePromise<E>;
    delete(entity: E, relation?: string): CancelablePromise<void>;
    protected getParamsFromEntity(entity: E): Object;
    protected getEntityType(): new () => E;
}

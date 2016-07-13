import { CancelablePromise } from "aurelia-utils";
import { HttpPersistenceManager } from "./http-persistence-manager";
import { DataAccessObject, Query, Sorting } from "aurelia-persistence";
export declare abstract class HttpDataAccessObject<E extends Object> implements DataAccessObject<E> {
    protected persistenceManager: HttpPersistenceManager;
    protected entityType: new () => E;
    constructor(persistenceManager: HttpPersistenceManager, entityType: new () => E);
    findAll(query?: Query, limit?: number, skip?: number, sorting?: Sorting, properties?: string[]): CancelablePromise<E[]>;
    findOne(query?: Query, skip?: number, sorting?: Sorting, properties?: string[]): CancelablePromise<E>;
    count(query?: Query, limit?: number, skip?: number): CancelablePromise<number>;
    get(params: Object, properties?: string[]): CancelablePromise<E>;
    save<D>(entity: E, data?: D): CancelablePromise<E>;
    delete(entity: E): CancelablePromise<void>;
    protected getEntityType(): new () => E;
}

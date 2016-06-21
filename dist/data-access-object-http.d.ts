import { CancelablePromise } from "aurelia-utils";
import { HttpPersistenceManager } from "./persistence-manager-http";
import { DataAccessObject, Query, Sorting } from "aurelia-persistence";
export declare abstract class HttpDataAccessObject<E extends Object> implements DataAccessObject<E> {
    protected persistenceManager: HttpPersistenceManager;
    constructor(persistenceManager: HttpPersistenceManager);
    findAll(query?: Query, limit?: number, skip?: number, sorting?: Sorting, properties?: string[]): CancelablePromise<E[]>;
    findOne(query?: Query, skip?: number, sorting?: Sorting, properties?: string[]): CancelablePromise<E>;
    count(query?: Query, limit?: number, skip?: number): CancelablePromise<number>;
    save<D>(entity: E, properties?: string[], data?: D): CancelablePromise<E>;
    delete(entity: E): CancelablePromise<void>;
    protected abstract getEntityType(): new () => E;
}

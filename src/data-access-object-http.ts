import {autoinject} from "aurelia-dependency-injection";
import {CancelablePromise} from "aurelia-utils";
import {HttpPersistenceManager} from "./persistence-manager-http";
import {DataAccessObject, FilterQuery, Query, Sorting} from "aurelia-persistence";

@autoinject
export abstract class HttpDataAccessObject<E extends Object> implements DataAccessObject<E> {

    protected persistenceManager: HttpPersistenceManager;

    public constructor(persistenceManager: HttpPersistenceManager) {
        this.persistenceManager = persistenceManager;
    }

    public findAll(query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, sorting: Sorting = new Sorting(), properties: string[] = []): CancelablePromise<E[]> {
        return this.persistenceManager.findAll<E>(this.getEntityType(), query, limit, skip, sorting, properties);
    }

    public findOne(query: Query = new FilterQuery(), skip: number = 0, sorting: Sorting = new Sorting(), properties: string[] = []): CancelablePromise<E> {
        return this.persistenceManager.findOne<E>(this.getEntityType(), query, skip, sorting, properties);
    }

    public count(query: Query = new FilterQuery(), limit: number = 0, skip: number = 0): CancelablePromise<number> {
        return this.persistenceManager.count<E>(this.getEntityType(), query, limit, skip);
    }

    public save<D>(entity: E, properties: string[] = [], data?: D): CancelablePromise<E> {
        return this.persistenceManager.save<E, D>(this.getEntityType(), entity, properties, data);
    }

    public delete(entity: E): CancelablePromise<void> {
        return this.persistenceManager.delete<E>(this.getEntityType(), entity);
    }

    protected abstract getEntityType(): new() => E;

}

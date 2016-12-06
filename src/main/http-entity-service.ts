import { autoinject} from "aurelia-dependency-injection";
import { CancelablePromise} from "aurelia-utils";
import { HttpPersistenceManager} from "./http-persistence-manager";
import { EntityService, FilterQuery, Query, Sorting} from "aurelia-persistence";

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
    }

    public findAll(query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, sorting: Sorting = new Sorting(), properties?: string[]): CancelablePromise<E[]> {
        return this.persistenceManager.findAll<E>(this.getEntityType(), query, limit, skip, sorting, properties);
    }

    public findOne(query: Query = new FilterQuery(), skip: number = 0, sorting: Sorting = new Sorting(), properties?: string[]): CancelablePromise<E> {
        return this.persistenceManager.findOne<E>(this.getEntityType(), query, skip, sorting, properties);
    }

    public count(query: Query = new FilterQuery(), limit: number = 0, skip: number = 0): CancelablePromise<number> {
        return this.persistenceManager.count<E>(this.getEntityType(), query, limit, skip);
    }

    public get(params: Object, properties?: string[]): CancelablePromise<E> {
        return this.persistenceManager.get<E>(this.getEntityType(), params, properties);
    }

    public save<D>(entity: E): CancelablePromise<E> {
        return this.persistenceManager.save<E>(this.getEntityType(), entity);
    }

    public delete(entity: E): CancelablePromise<void> {
        return this.persistenceManager.delete<E>(this.getEntityType(), entity);
    }

    protected getParamsFromEntity(entity: E): Object {
        return entity;
    }

    protected getEntityType(): new() => E {
        return this.entityType;
    }

}

import { PersistenceManager, Query, Sorting } from "aurelia-persistence";
import { HttpClient } from "aurelia-http-client";
import { CancelablePromise } from "aurelia-utils";
import { TypeBinder } from "type-binder";
export declare class HttpPersistenceManager implements PersistenceManager {
    httpClient: HttpClient;
    typeBinder: TypeBinder;
    locators: Map<new () => Object, Map<string, string>>;
    filterHeaderName: string;
    limitHeaderName: string;
    skipHeaderName: string;
    sortHeaderName: string;
    propertyFilterHeaderName: string;
    countTotalHeaderName: string;
    countFilterHeaderName: string;
    propertyFilterSeparator: string;
    private collectionRelation;
    private entityRelation;
    constructor(httpClient: HttpClient, typeBinder: TypeBinder);
    addEntityType<E extends Object>(type: new () => E, collectionUri: string, entityUri: string): Promise<void>;
    findAll<E extends Object>(type: new () => E, query?: Query, limit?: number, skip?: number, sorting?: Sorting, properties?: string[], relation?: string, relationParams?: Object): CancelablePromise<E[]>;
    findOne<E extends Object>(type: new () => E, query?: Query, skip?: number, sorting?: Sorting, properties?: string[], relation?: string, relationParams?: Object): CancelablePromise<E>;
    count<E extends Object>(type: new () => E, query?: Query, limit?: number, skip?: number, relation?: string, relationParams?: Object): CancelablePromise<number>;
    get<E extends Object>(type: new () => E, params: Object, properties?: string[], relation?: string): CancelablePromise<E>;
    save<E extends Object>(type: new () => E, entity: E, relation?: string, relationParams?: Object): CancelablePromise<E>;
    delete<E extends Object>(type: new () => E, entity: E, relation?: string, relationParams?: Object): CancelablePromise<void>;
    link<E extends Object>(type: new () => E, relation: string, params?: Object): string;
}

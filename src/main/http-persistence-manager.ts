import { autoinject } from "aurelia-dependency-injection";
import { PersistenceManager, Query, FilterQuery, Sorting } from "aurelia-persistence";
import { RequestBuilder, HttpClient, HttpResponseMessage } from "aurelia-http-client";
import { HttpHeaders, LinkHeaderParser, ContentType } from "aurelia-http-utils";
import { CancelablePromise } from "aurelia-utils";
import { JsonPatch, JsonMultipartRelatedInterceptor } from "aurelia-json";
import { TypeBinder } from "type-binder";
import * as UrlTemplate from "url-template";

RequestBuilder.addHelper("asCount", () => (client, processor, message) => {
      message.method = 'COUNT';
});

@autoinject
export class HttpPersistenceManager implements PersistenceManager {

    public httpClient: HttpClient;

    public typeBinder: TypeBinder;

    public locators: Map<new() => Object, Map<string, string>>;

    public filterHeaderName: string = "X-Filter";

    public limitHeaderName: string = "X-Limit";

    public skipHeaderName: string = "X-Skip";

    public sortHeaderName: string = "X-Sort";

    public propertyFilterHeaderName: string = "X-Property-Filter";

    public countTotalHeaderName: string = "X-Count-Total"

    public countFilterHeaderName: string = "X-Count-Filter";

    public propertyFilterSeparator: string = ",";

    private collectionRelation: string = "collection";

    private entityRelation: string = "entity";

    public constructor(httpClient: HttpClient, typeBinder: TypeBinder) {
        this.httpClient = httpClient;
        this.typeBinder = typeBinder;
        this.locators = new Map<new() => Object, Map<string, string>>();
    }

    public addEntityType<E extends Object>(type: new() => E, collectionUri: string, entityUri: string): Promise<void> {
        let locators = new Map<string, string>();
        locators.set(this.collectionRelation, collectionUri);
        locators.set(this.entityRelation, entityUri);
        this.locators.set(type, locators);
        return Promise.resolve();
    }

    public findAll<E extends Object>(
            type: new() => E,
            query: Query = new FilterQuery(),
            limit: number = 0,
            skip: number = 0,
            sorting: Sorting = new Sorting(),
            properties?: string[],
            relation: string = this.collectionRelation,
            relationParams?: Object): CancelablePromise<E[]> {
        let url = this.link(type, relation, relationParams);
        let requestBuilder = this.httpClient.createRequest(url).asGet();
        requestBuilder.withHeader(this.filterHeaderName, JSON.stringify(query))
            .withHeader(this.limitHeaderName, `${limit}`)
            .withHeader(this.skipHeaderName, `${skip}`)
            .withHeader(this.sortHeaderName, JSON.stringify(sorting));
        if (Array.isArray(properties)) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(this.propertyFilterSeparator));
        }
        let request = <CancelablePromise<HttpResponseMessage>> requestBuilder.send();
        let promise = <CancelablePromise<E[]>> request.then(success => this.typeBinder.bind(success.content, Array, type));
        promise.cancel = request.cancel;
        return promise;
    }

    public findOne<E extends Object>(
            type: new() => E,
            query: Query = new FilterQuery(),
            skip: number = 0,
            sorting: Sorting = new Sorting(),
            properties?: string[],
            relation: string = this.collectionRelation,
            relationParams?: Object): CancelablePromise<E> {
        let entities = <CancelablePromise<E[]>> this.findAll(type, query, 1, skip, sorting, properties, relation, relationParams);
        let promise = <CancelablePromise<E>> entities.then(entities => {
            if (entities.length > 0) {
                return entities.shift();
            } else throw new Error("Entity not found.");
        });
        promise.cancel = entities.cancel;
        return promise;
    }

    public count<E extends Object>(
            type: new() => E,
            query: Query = new FilterQuery(),
            limit: number = 0,
            skip: number = 0,
            relation: string = this.collectionRelation,
            relationParams: Object = { }): CancelablePromise<number> {
        let url = this.link(type, relation, relationParams);
        return this.httpCount(url, query, limit, skip);
    }

    public httpCount(url: string, query: Query = new FilterQuery(), limit: number = 0, skip: number = 0): CancelablePromise<number> {
        let request = <CancelablePromise<HttpResponseMessage>> (<any>this.httpClient).createRequest(url)
            .asCount()
            .withHeader(this.filterHeaderName, JSON.stringify(query))
            .withHeader(this.limitHeaderName, JSON.stringify(limit))
            .withHeader(this.skipHeaderName, JSON.stringify(skip))
            .send();
        let promise = <CancelablePromise<number>> request.then(success => <number> success.content);
        promise.cancel = request.cancel;
        return promise;
    }

    public get<E extends Object>(
            type: new() => E,
            params: Object,
            properties?: string[],
            relation: string = this.entityRelation): CancelablePromise<E> {
        let url = this.link(type, relation, params);
        return this.httpGet(url, properties, type);
    }

    public httpGet<T>(url: string, properties: string[], type: new() => T, ...generics: any[]): CancelablePromise<T> {
        let requestBuilder = this.httpClient.createRequest(url).asGet();
        if (properties) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(","));
        }
        let request = <CancelablePromise<HttpResponseMessage>> requestBuilder.send();
        let promise = <CancelablePromise<T>> request.then(success => this.typeBinder.bind(success.content, type));
        promise.cancel = request.cancel;
        return promise;
    }

    public save<E extends Object>(
            type: new() => E,
            entity: E,
            relation?: string,
            relationParams?: Object): CancelablePromise<E> {
        let promise: CancelablePromise<E>;
        if (this.typeBinder.isBound(type, entity)) {
            let patch = JsonPatch.diff(entity);
            if (patch.length > 0) {
                let url = this.link(type, relation || this.entityRelation, relationParams || entity);
                promise = <CancelablePromise<E>> this.httpClient.createRequest(url)
                    .asPatch()
                    .withContent(patch)
                    .withInterceptor(new JsonMultipartRelatedInterceptor(ContentType.APPLICATION_JSON_PATCH))
                    .send()
                    .then(success => this.httpClient.get(url))
                    .then(success => this.typeBinder.bind(success.content, type));
            } else {
                promise = <CancelablePromise<E>> Promise.resolve(entity);
                promise.cancel = () => { };
            }
        } else {
            let url = this.link(type, relation || this.collectionRelation, relationParams || entity);
            promise = <CancelablePromise<E>> this.httpClient.createRequest(url)
                .asPost()
                .withContent(entity)
                .withInterceptor(new JsonMultipartRelatedInterceptor(ContentType.APPLICATION_JSON))
                .send()
                .then(success => this.httpClient.get(HttpHeaders.LOCATION))
                .then(success => this.typeBinder.bind(success.content, type));
        }
        return promise;
    }

    public delete<E extends Object>(
            type: new() => E,
            entity: E,
            relation: string = this.entityRelation,
            relationParams?: Object): CancelablePromise<void> {
        let url = this.link(type, relation, relationParams || entity);
        let request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asDelete().send();
        let promise = <CancelablePromise<void>> request.then(success => null);
        promise.cancel = request.cancel;
        return promise;
    }

    public link<E extends Object>(
            type: new() => E,
            relation: string,
            params?: Object): string {
        return UrlTemplate.parse(this.locators.get(type).get(relation)).expand(params);
    }

}

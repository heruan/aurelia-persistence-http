import {autoinject} from "aurelia-dependency-injection";
import {PersistenceManager, Query, FilterQuery, Sorting} from "aurelia-persistence";
import {HttpClient, HttpResponseMessage} from "aurelia-http-client";
import {HttpHeaders, LinkHeaderParser} from "aurelia-http-utils";
import {CancelablePromise} from "aurelia-utils";
import {JsonPatch} from "aurelia-json";
import * as UrlTemplate from "url-template";

@autoinject
export class HttpPersistenceManager implements PersistenceManager {

    protected httpClient: HttpClient;

    protected linkHeaderParser: LinkHeaderParser;

    protected relations: Map<new() => Object, Map<string, string>>;

    protected filterHeaderName: string = "X-Filter";

    protected limitHeaderName: string = "X-Limit";

    protected skipHeaderName: string = "X-Skip";

    protected sortingHeaderName: string = "X-Sort";

    protected propertyFilterHeaderName: string = "X-Property-Filter";

    protected propertyFilterSeparator: string = ",";

    protected collectionRelation: string = "list";

    protected entityRelation: string = "self";

    protected countRelation: string = "count";

    protected identityProperty: string = "@id";

    public constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
        this.linkHeaderParser = new LinkHeaderParser();
        this.relations = new Map<new() => Object, Map<string, string>>();
    }

    public setCollectionRelation(relation: string): void {
        this.collectionRelation = relation;
    }

    public setEntityRelation(relation: string): void {
        this.entityRelation = relation;
    }

    public setCountRelation(relation: string): void {
        this.countRelation = relation;
    }

    public setIdentityProperty(property: string): void {
        this.identityProperty = property;
    }

    public identify<E extends Object>(entity: E): string {
        return entity.hasOwnProperty(this.identityProperty) ? entity[this.identityProperty] : null;
    }

    public addEntityType<E extends Object>(type: new() => E, location: string): Promise<void> {
        return this.httpClient.options(location).then(success => {
            let linkHeader = success.headers.get(HttpHeaders.LINK);
            let relations = this.linkHeaderParser.parse(linkHeader.split(","));
            this.relations.set(type, relations);
        });
    }

    public findAll<E extends Object>(type: new() => E, query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, sorting: Sorting = new Sorting(), properties: string[] = []): CancelablePromise<E[]> {
        let url = this.link(type, this.collectionRelation);
        let request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url)
        .asGet()
        .withHeader(this.filterHeaderName, JSON.stringify(query))
        .withHeader(this.limitHeaderName, JSON.stringify(limit))
        .withHeader(this.skipHeaderName, JSON.stringify(skip))
        .withHeader(this.sortingHeaderName, JSON.stringify(sorting))
        .withHeader(this.propertyFilterHeaderName, properties.join(this.propertyFilterSeparator))
        .send();
        let promise = <CancelablePromise<E[]>> request.then(success => <E[]> success.content);
        promise.cancel = request.cancel;
        return promise;
    }

    public findOne<E extends Object>(type: new() => E, query: Query = new FilterQuery(), skip: number = 0, sorting: Sorting = new Sorting(), properties: string[] = []): CancelablePromise<E> {
        let entities = <CancelablePromise<E[]>> this.findAll(type, query, 1, skip, sorting, properties);
        let promise = <CancelablePromise<E>> entities.then(entities => entities.length > 0 ? entities.shift() : null);
        promise.cancel = entities.cancel;
        return promise;
    }

    public count<E extends Object>(type: new() => E, query: Query = new FilterQuery(), limit: number = 0, skip: number = 0): CancelablePromise<number> {
        let url = this.link(type, this.countRelation);
        let request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url)
        .asGet()
        .withHeader(this.filterHeaderName, JSON.stringify(query))
        .withHeader(this.limitHeaderName, JSON.stringify(limit))
        .withHeader(this.skipHeaderName, JSON.stringify(skip))
        .send();
        let promise = <CancelablePromise<number>> request.then(success => <number> success.content);
        promise.cancel = request.cancel;
        return promise;
    }

    public save<E extends Object, D>(type: new() => E, entity: E, properties: string[] = [], data?: D): CancelablePromise<E> {
        let request: CancelablePromise<HttpResponseMessage>;
        let location: Promise<string>;
        let url = this.link(type, this.entityRelation, entity);
        if (data instanceof FormData || this.identify(entity) === null) {
            let url = this.link(type, this.collectionRelation);
            request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asPost().withContent(data ? data : entity).send();
            location = request.then(success => success.headers.get(HttpHeaders.LOCATION));
        } else if (data instanceof JsonPatch || Array.isArray(data)) {
            let url = this.link(type, this.entityRelation, entity);
            request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asPatch().withContent(data).send();
            location = request.then(success => url);
        } else {
            let url = this.link(type, this.entityRelation, entity);
            request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asPut().withContent(entity).send();
            location = request.then(success => url);
        }
        let retrieve = location.then(url => this.httpClient.createRequest(url).asGet().withHeader(this.propertyFilterHeaderName, properties.join(this.propertyFilterSeparator)).send());
        let promise = <CancelablePromise<E>> retrieve.then(success => <E> success.content);
        promise.cancel = request.cancel;
        return promise;
    }

    public delete<E extends Object>(type: new() => E, entity: E): CancelablePromise<void> {
        let url = this.link(type, this.entityRelation, entity);
        let request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asDelete().send();
        let promise = <CancelablePromise<void>> request.then(success => null);
        promise.cancel = request.cancel;
        return promise;
    }

    protected link<E extends Object>(type: new() => E, relation: string, params?: Object): string {
        return UrlTemplate.parse(this.relations.get(type).get(relation)).expand(params);
    }

}

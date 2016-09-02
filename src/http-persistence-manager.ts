import {autoinject} from "aurelia-dependency-injection";
import {PersistenceManager, Query, FilterQuery, Sorting} from "aurelia-persistence";
import {HttpClient, HttpResponseMessage} from "aurelia-http-client";
import {HttpHeaders, LinkHeaderParser, MediaType} from "aurelia-http-utils";
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

    protected countTotalHeaderName: string = "X-Count-Total"

    protected countFilterHeaderName: string = "X-Count-Filter";

    protected propertyFilterSeparator: string = ",";

    public collectionRelation: string = "list";

    public entityRelation: string = "self";

    public countRelation: string = "count";

    public identityProperty: string = "@id";

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
            // let linkHeader = success.headers.get(HttpHeaders.LINK);
            // let relations = this.linkHeaderParser.parse(linkHeader.split(","));
            // FIXME should be as above when this gets fixed: https://github.com/aurelia/http-client/issues/128
            let relations = new Map<string, string>();
            let links = success.content["links"];
            Object.keys(links).forEach(rel => relations.set(rel, links[rel]));
            this.relations.set(type, relations);
        });
    }

    public findAll<E extends Object, R>(type: new() => E, query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, sorting: Sorting = new Sorting(), properties?: string[], relation: string = this.collectionRelation): CancelablePromise<R[]> {
        let url = this.link(type, relation);
        let requestBuilder = this.httpClient.createRequest(url).asGet();
        requestBuilder.withHeader(this.filterHeaderName, JSON.stringify(query))
        .withHeader(this.limitHeaderName, `${limit}`)
        .withHeader(this.skipHeaderName, `${skip}`)
        .withHeader(this.sortingHeaderName, JSON.stringify(sorting));
        if (Array.isArray(properties)) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(this.propertyFilterSeparator));
        }
        let request = <CancelablePromise<HttpResponseMessage>> requestBuilder.send();
        let promise = <CancelablePromise<R[]>> request.then(success => {
            // let countTotal = +success.headers.get(this.countTotalHeaderName);
            // let countFilter = +success.headers.get(this.countFilterHeaderName);
            return <R[]> success.content;
        });
        promise.cancel = request.cancel;
        return promise;
    }

    public findOne<E extends Object, R>(type: new() => E, query: Query = new FilterQuery(), skip: number = 0, sorting: Sorting = new Sorting(), properties?: string[], relation: string = this.collectionRelation): CancelablePromise<R> {
        let entities = <CancelablePromise<R[]>> this.findAll(type, query, 1, skip, sorting, properties, relation);
        let promise = <CancelablePromise<R>> entities.then(entities => entities.length > 0 ? entities.shift() : null);
        promise.cancel = entities.cancel;
        return promise;
    }

    public count<E extends Object>(type: new() => E, query: Query = new FilterQuery(), limit: number = 0, skip: number = 0, relation: string = this.countRelation): CancelablePromise<number> {
        let url = this.link(type, relation);
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

    public get<E extends Object, R>(type: new() => E, params: Object, properties?: string[], relation: string = this.entityRelation): CancelablePromise<R> {
        let url = this.link(type, relation, params);
        let requestBuilder = this.httpClient.createRequest(url).asGet();
        if (properties) {
            requestBuilder.withHeader(this.propertyFilterHeaderName, properties.join(","));
        }
        let request = <CancelablePromise<HttpResponseMessage>> requestBuilder.send();
        let promise = <CancelablePromise<R>> request.then(success => <R> success.content);
        promise.cancel = request.cancel;
        return promise;
    }

    public save<E extends Object, D, R>(type: new() => E, entity: E, data?: D, relation?: string, relationParams?: Object): CancelablePromise<R> {
        let request: CancelablePromise<HttpResponseMessage>;
        let location: Promise<string>;
        if (data instanceof FormData || this.identify(entity) === null) {
            let url = this.link(type, relation || this.collectionRelation, relationParams || entity);
            request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asPost().withContent(data || entity).send();
            location = request.then(success => success.headers.get(HttpHeaders.LOCATION) || null);
        } else if (data instanceof JsonPatch || Array.isArray(data)) {
            let url = this.link(type, relation || this.entityRelation, relationParams || entity);
            request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asPatch()
            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_PATCH)
            .withContent(data).send();
            location = request.then(success => url);
        } else {
            let url = this.link(type, relation || this.entityRelation, relationParams || entity);
            request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asPut().withContent(data || entity).send();
            location = request.then(success => url);
        }
        let retrieve = <CancelablePromise<R>> location.then(url => url ? this.httpClient.createRequest(url).asGet().send() : null).then(success => success ? <R> success.content : entity);
        retrieve.cancel = request.cancel;
        return retrieve;
    }

    public delete<E extends Object>(type: new() => E, entity: E, relation: string = this.entityRelation, relationParams?: Object): CancelablePromise<void> {
        let url = this.link(type, relation, relationParams || entity);
        let request = <CancelablePromise<HttpResponseMessage>> this.httpClient.createRequest(url).asDelete().send();
        let promise = <CancelablePromise<void>> request.then(success => null);
        promise.cancel = request.cancel;
        return promise;
    }

    public link<E extends Object>(type: new() => E, relation: string, params?: Object): string {
        return UrlTemplate.parse(this.relations.get(type).get(relation)).expand(params);
    }

}

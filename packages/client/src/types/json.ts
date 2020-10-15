declare type Optional<T> = T | undefined;

export interface Dictionary<T = unknown> {
    [key: string]: Optional<T>;
}

export declare type JsonPrimitive = null | boolean | number | string;
/**
 * Any valid JSON collection value.
 */
export declare type JsonCollection = JsonMap | JsonArray;
/**
 * Any valid JSON value.
 */
export declare type AnyJson = JsonPrimitive | JsonCollection;
/**
 * Any JSON-compatible object.
 */
export interface JsonMap extends Dictionary<AnyJson> {
}
/**
 * Any JSON-compatible array.
 */
export interface JsonArray extends Array<AnyJson> {
}
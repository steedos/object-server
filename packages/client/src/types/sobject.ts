import { JsonMap } from './json';

export type Filters = string | Array<any>

export type Fields = string | Array<string>

export type Options = {
    $top?: Number,
    $skip?: Number,
    $orderby?: Number,
    $count?: boolean,
    $filter?: Filters,
    $select?: Fields
}

export type Record = JsonMap


/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { AsyncCreatable, set } from '@salesforce/kit';
import { AnyJson, definiteEntriesOf, definiteValuesOf, get, getAnyJson, JsonMap, Optional } from '@salesforce/ts-types';
import { Dictionary } from '@salesforce/ts-types';

/**
 * The allowed types stored in a config store.
 */
export type ConfigValue = AnyJson;

/**
 * The type of entries in a config store defined by the key and value type of {@link ConfigContents}.
 */
export type ConfigEntry = [string, ConfigValue];

/**
 * The type of content a config stores.
 */
export type ConfigContents = Dictionary<ConfigValue>;

/**
 * An interface for a config object with a persistent store.
 */
export interface ConfigStore {
  // Map manipulation methods
  entries(): ConfigEntry[];
  get(key: string): Optional<ConfigValue>;
  getKeysByValue(value: ConfigValue): string[];
  has(key: string): boolean;
  keys(): string[];
  set(key: string, value: ConfigValue): ConfigContents;
  unset(key: string): boolean;
  unsetAll(keys: string[]): boolean;
  clear(): void;
  values(): ConfigValue[];

  forEach(actionFn: (key: string, value: ConfigValue) => void): void;
  awaitEach(actionFn: (key: string, value: ConfigValue) => Promise<void>): Promise<void>;

  // Content methods
  getContents(): ConfigContents;
  setContents(contents?: ConfigContents): void;
}

/**
 * An abstract class that implements all the config management functions but
 * none of the storage functions.
 *
 * **Note:** To see the interface, look in typescripts autocomplete help or the npm package's ConfigStore.d.ts file.
 */
export abstract class BaseConfigStore<T extends BaseConfigStore.Options> extends AsyncCreatable<T>
  implements ConfigStore {
  protected options: T;

  // Initialized in setContents
  private contents!: ConfigContents;

  /**
   * Constructor.
   * @param options The options for the class instance.
   * @ignore
   */
  public constructor(options: T) {
    super(options);
    this.options = options;
    this.setContents(this.options.contents || {});
  }

  /**
   * Returns an array of {@link ConfigEntry} for each element in the config.
   */
  public entries(): ConfigEntry[] {
    return definiteEntriesOf(this.contents);
  }

  /**
   * Returns the value associated to the key, or undefined if there is none.
   * @param key The key.
   */
  public get(key: string): Optional<ConfigValue> {
    return getAnyJson(this.contents, key);
  }

  /**
   * Returns the list of keys that contain a value.
   * @param value The value to filter keys on.
   */
  public getKeysByValue(value: ConfigValue): string[] {
    const matchedEntries = this.entries().filter((entry: ConfigEntry) => entry[1] === value);
    // Only return the keys
    return matchedEntries.map((entry: ConfigEntry) => entry[0]);
  }

  /**
   * Returns a boolean asserting whether a value has been associated to the key in the config object or not.
   * @param key The key.
   */
  public has(key: string): boolean {
    return !!get(this.contents, key);
  }

  /**
   * Returns an array that contains the keys for each element in the config object.
   */
  public keys(): string[] {
    return Object.keys(this.contents);
  }

  /**
   * Sets the value for the key in the config object.
   * @param key The Key.
   * @param value The value.
   */
  public set(key: string, value: ConfigValue): ConfigContents {
    set(this.contents, key, value);
    return this.contents;
  }

  /**
   * Returns `true` if an element in the config object existed and has been removed, or `false` if the element does not
   * exist. {@link BaseConfigStore.has} will return false afterwards.
   * @param key The key.
   */
  public unset(key: string): boolean {
    return delete this.contents[key];
  }

  /**
   * Returns `true` if all elements in the config object existed and have been removed, or `false` if all the elements
   * do not exist (some may have been removed). {@link BaseConfigStore.has(key)} will return false afterwards.
   * @param keys The keys.
   */
  public unsetAll(keys: string[]): boolean {
    return keys.reduce((val, key) => val && this.unset(key), true);
  }

  /**
   * Removes all key/value pairs from the config object.
   */
  public clear(): void {
    this.contents = {};
  }

  /**
   * Returns an array that contains the values for each element in the config object.
   */
  public values(): ConfigValue[] {
    return definiteValuesOf(this.contents);
  }

  /**
   * Returns the entire config contents.
   */
  public getContents(): ConfigContents {
    if (!this.contents) {
      this.setContents();
    }
    return this.contents;
  }

  /**
   * Sets the entire config contents.
   * @param contents The contents.
   */
  public setContents(contents?: ConfigContents): void {
    this.contents = contents || {};
  }

  /**
   * Invokes `actionFn` once for each key-value pair present in the config object.
   * @param {function} actionFn The function `(key: string, value: ConfigValue) => void` to be called for each element.
   */
  public forEach(actionFn: (key: string, value: ConfigValue) => void): void {
    const entries = this.entries();
    for (const entry of entries) {
      actionFn(entry[0], entry[1]);
    }
  }

  /**
   * Asynchronously invokes `actionFn` once for each key-value pair present in the config object.
   * @param {function} actionFn The function `(key: string, value: ConfigValue) => Promise<void>` to be called for
   * each element.
   * @returns {Promise<void>}
   */
  public async awaitEach(actionFn: (key: string, value: ConfigValue) => Promise<void>): Promise<void> {
    const entries = this.entries();
    for (const entry of entries) {
      await actionFn(entry[0], entry[1]);
    }
  }

  /**
   * Convert the config object to a JSON object. Returns the config contents.
   * Same as calling {@link ConfigStore.getContents}
   */
  public toObject(): JsonMap {
    return this.contents;
  }

  /**
   * Convert an object to a {@link ConfigContents} and set it as the config contents.
   * @param obj The object.
   */
  public setContentsFromObject<U extends object>(obj: U): void {
    this.contents = {};
    Object.entries(obj).forEach(([key, value]) => {
      set(this.contents, key, value);
    });
  }
}

/**
 * @ignore
 */
export namespace BaseConfigStore {
  /**
   * Options for the config store.
   */
  export interface Options {
    /**
     * Intial contents for the config.
     */
    contents?: ConfigContents;
  }
}

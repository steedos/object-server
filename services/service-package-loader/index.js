"use strict";

const objectql = require('@steedos/objectql');
const core = require('@steedos/core');
const triggerLoader = require('./lib').triggerLoader;
const path = require('path');
const Future = require('fibers/future');
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    name: "service-package-loader",

    /**
     * Settings
     */
    settings: {
        path: '', // 扫描加载原数据的路径
        name: '' // service name
    },

    /**
     * Dependencies
     */
    dependencies: ['metadata-server'],

    /**
     * Actions
     */
    actions: {

    },

    /**
     * Events
     */
    events: {
        "translations.change": {
            handler() {
                core.loadTranslations()
            }
        },
        "translations.object.change": {
            handler() {
                core.loadObjectTranslations()
            }
        }
    },

    /**
     * Methods
     */
    methods: {
        loadPackageMetadataFiles: async function (packagePath, name, datasourceName) {
            await Future.task(async () => {
                if (!datasourceName) {
                    datasourceName = 'default';
                }
                objectql.getSteedosSchema(this.broker);
                packagePath = path.join(packagePath, '**');
                await objectql.loadStandardMetadata(name, datasourceName);
                await objectql.addAllConfigFiles(packagePath, datasourceName, name);
                const datasource = objectql.getDataSource(datasourceName);
				datasource.setServiceName(name);
                await datasource.init();
                await triggerLoader.load(this.broker, packagePath, name);
                return;
            }).promise();
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        this.logger.debug('service package loader created!!!');
    },

    merged(schema) {
        schema.name = `~packages-${schema.name}`;
    },

    /**
     * Service started lifecycle event handler
     */
    async started() {
        let packageInfo = this.settings.packageInfo;
        if (!packageInfo) {
            return;
        }
        const { path, datasource } = packageInfo;
        if (!path) {
            this.logger.error(`Please config packageInfo in your settings.`);
            console.log(`service ${this.name} started`);
            return;
        }
        await this.loadPackageMetadataFiles(path, this.name, datasource);
        console.log(`service ${this.name} started`);
    },

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {
        await this.broker.call(`metadata.refreshServiceMetadatas`, { offlinePackageServices: [this.name] });
    }
};

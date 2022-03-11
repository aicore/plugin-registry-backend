/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */
import './env.js';
import searchClient from '@aicore/elasticsearch-lib';

const INDEX_NAME = process.env.ELASTIC_SEARCH_INDEX_NAME;
const NODE_ADDRESS = process.env.ELASTIC_SEARCH_HOST_ADDRESS;
const PAGE_SIZE = parseInt(process.env.ELASTIC_SEARCH_PAGE_SIZE);
/**
 * Accepts the necessary params to construct the search query object,
 * applies the passed filters and returns the result object from elastic search. 
 * @param {String} query (Required)
 * @param {Object} filters  (Optional)
 * @param {Integer} resultSize (Optional)
 * @param {Integer} skipIndex (Optional)
 * @returns {Object}
 */
async function performTextSearch(query, filters = {}, 
    resultSize = PAGE_SIZE, skipIndex = 0) {

    if (!query) {
        throw new Error("Invalid Request: text query is a required parameter.");
    }
    let shouldArray = [
        { match: { 'metadata.title': query } },
        { match: { 'metadata.name': query } },
        { match: { 'metadata.keywords': query } },
        { match: { 'metadata.author.name': query } }
    ];

    if (filters.hasOwnProperty('fields')) {
        filters.fields.forEach(field => {
            shouldArray.push({ match: { [field] : query }});
        });
    }

    if (filters.hasOwnProperty('assetType')) {
        shouldArray.push({ match: { 'metadata.assetType' : filters.assetType }});
    }

    let boolObj = {
        should: shouldArray
    };

    let searchQuery = {
        index: INDEX_NAME,
        from: skipIndex,
        size: resultSize,
        body: {
            query: {
                nested: {
                    path: 'metadata',
                    query: {
                        bool: boolObj
                    }
                }
            }
        }
    };

    if (filters.hasOwnProperty('sortBy')) {   
        searchQuery = {
            index: INDEX_NAME,
            size: resultSize,
            body: {
                query: {
                    nested: {
                        path: 'metadata',
                        query: {
                            bool: boolObj
                        }
                    }
                },
                sort: [{ 'totalDownloads': { 'order': filters.sortBy} }]
            }
        };
    }

    let response = await searchClient.search(NODE_ADDRESS, INDEX_NAME, searchQuery);
    return response;
}
/**
 * Accepts the necessary params to construct the search query object to retrieve plugins,
 * applies the passed filters and returns the result object from elastic search. 
 * @param {String} assetType (Required)
 * @param {Object} filters  (Optional)
 * @param {Integer} resultSize (Optional)
 * @param {Integer} skipIndex (Optional)
 * @returns {Object}
 */
async function getPlugins(assetType, filters = {}, resultSize = PAGE_SIZE, skipIndex = 0) {

    if (!assetType) {
        throw new Error("Invalid Request: assetType is a required parameter.");
    }

    let mustArray = [
        { match: { 'metadata.assetType' : assetType } }
    ];

    if (filters.hasOwnProperty('keywords')) {
    
        filters.keywords.forEach(keyword => {
            mustArray.push({ match_phrase: { 'metadata.keywords': keyword } });          
        });
    }

    let searchQuery = {
        index: INDEX_NAME,
        from: skipIndex,
        size: resultSize,
        body: {
            query: {
                nested: {
                  path: 'metadata',
                  query: {
                    bool: {
                      must: mustArray
                    }
                  }
                }
            }
        }
    };

    if (filters.hasOwnProperty('sortBy')) {
        searchQuery = {
            index: INDEX_NAME,
            from: skipIndex,
            size: resultSize,
            body: {
                query: {
                    nested: {
                        path: 'metadata',
                        query: {
                            bool: {
                                must: mustArray
                            }
                        }
                    }
                },
                sort: [{ 'totalDownloads': { 'order': filters.sortBy} }]
            }
        };
    }
    let response = await searchClient.search(NODE_ADDRESS, INDEX_NAME, searchQuery);
    return response;
}

export default {
    performTextSearch,
    getPlugins
};
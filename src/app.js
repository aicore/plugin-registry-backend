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
import express from 'express';
import cors from 'cors';
import requestValidator from './request_validator.js';
import searchHelper from './elastic_search_helper.js';
import npmHelper from './npm_helper.js';

const app = express();
const port = 3000;
let filters = {};
let resultSize = 10;
let skipIndex = 0;

app.use(express.json());

app.use(cors({
    methods: ['GET', 'POST']
}));

/**
 * SEARCH API : This API supports text-based search queries (see below for detailed params) 
 * on plugin registry. Search API can retrieve plugins(Extensions/Themes) by searching titles, 
 * keywords or authornames(by default). We can also search on more fields apart from the previously mentioned
 * by passing it as a param. This API can be a functional entry point for all the UI search-box usecases.
 * 
 * Parameters:
 * Required:
 * 1. clientID {String}: A unique identifier required for authenticating clients
 * 2. query {String}: String containing the text to  be searched
 * 
 * Optional:
 * 1. filters {Object} (Default: Empty) : Object contaning the fields array and sortBy field. See below e.g
 *      a. fieldsArray {String Array}: Array containing additional fields to be searched
 *      b. sortyBy {String}: Constant value(asc/desc) to sort the results by total 
 *      number of downloads.
 *  E.g const filter = { fields:['metadata.author.name','metadata.author.email'], sortBy:'desc'}
 * 2. resultSize {Integer} (Default: 10) : SearchResults list size
 * 3. skipIndex {Integer} {Default: 0} : Integer value required for pagination
 *  
 */
app.post('/search', async function(req, res) {
    let validationResponse = await requestValidator.validateSearchRequest(req);

    res.set({
        'Access-Control-Allow-Origin': '*'
    });

    if (!validationResponse.isValid) {
        res.status(validationResponse.statusCode);
        res.json({error: validationResponse.errorMessage})
        return ;
    }

    const searchQuery = req.body["query"];
    assignOptionalParameters(req);

    try {
        let searchResponse = await searchHelper.performTextSearch(searchQuery, filters, resultSize, skipIndex);
        let modifiedResponse = await npmHelper.updateDownloadStats(searchResponse);
        console.log("Success: Search API Request succeeded with no errors, Please check logs for response");
        res.status(200);
        res.json(modifiedResponse);
    } catch (error) {
        res.status(500);
        res.json({error: JSON.stringify(error)});
    }
});

/**
 * getPlugins API : This API can be used to retrieve plugins by assetType(Extension/Theme) (see below for detailed params) 
 * on plugin registry. We can also apply certain keywords as filters to refine our search results. 
 * This API can be a functional entry point for loading plugins by default in the UI.
 * 
 * Parameters:
 * Required:
 * 1. clientID {String}: A unique identifier required for authenticating clients
 * 2. assetType {String}: accepted values are 'EXTENSION' or 'THEME'
 * 
 * Optional:
 * 1. filters {Object} (Default: Empty) : Object contaning the fields array and sortBy field. See below e.g
 *      a. keywordsArray {String Array}: Array containing additional keywords to match
 *      b. sortyBy {String}: Constant value(asc/desc) to sort the results by total 
 *      number of downloads.
 *  E.g const filter = { keywords:['HTML', 'HTML5'], sortBy:'desc'}
 * 2. resultSize {Integer} (Default: 10) : SearchResults list size
 * 3. skipIndex {Integer} {Default: 0} : Integer value required for pagination
 *  
 */
app.post('/getPlugins', async function(req, res) {
    let validationResponse = await requestValidator.validateGetPluginsRequest(req);

    res.set({
        'Access-Control-Allow-Origin': '*'
    });

    if (!validationResponse.isValid) {
        res.status(validationResponse.statusCode);
        res.json({error: validationResponse.errorMessage})
        return ;
    }

    const assetType = req.body["assetType"];
    assignOptionalParameters(req);

    try {
        let pluginsResponse = await searchHelper.getPlugins(assetType, filters, resultSize, skipIndex);
        let modifiedResponse = await npmHelper.updateDownloadStats(pluginsResponse);
        console.log("Success: GetPlugins API Request succeeded with no errors, Please check logs for response");
        res.status(200);
        res.json(modifiedResponse);
    } catch (error) {
        res.status(500);
        res.json({error: JSON.stringify(error)});
    }
});

app.listen(port, () => {
    console.log(`Plugin-Registry-Backend server listening at http://localhost:${port}`);
});

async function assignOptionalParameters(req) {
    if (req.body.hasOwnProperty('filters')) {
        filters = req.body["filters"];
    }
    if (req.body.hasOwnProperty("resultSize")) {
        resultSize = req.body.resultSize;
    }
    if (req.body.hasOwnProperty("skipIndex")) {
        resultSize = req.body.resultSize;
    }
}

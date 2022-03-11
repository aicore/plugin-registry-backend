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
import request from "superagent";

const NPM_PACKAGE_PREFIX = '@phoenix-plugin-registry/';
const NPM_STATS_START_DATE = process.env.NPM_STATS_START_DATE;
const CURR_DATE = new Date().toISOString().slice(0, 10);
/**
 * Updates the totalDownload field by retrieving download data from NPM and returns the modified list.
 * @param {Object Array} searchList 
 * @returns {Object} 
 */
async function updateDownloadStats(searchList) {
    let modifiedList = [], downloadList = [];
    if (!searchList) {
        throw new Error("Error in NPM Helper: Undefined search results passed as param");
    }
    let i = 0;
    for (i = 0; i < searchList.length; i++) {
        let element = searchList[i];
        if (element.hasOwnProperty('_source') && element._source.hasOwnProperty('totalDownloads')
            && element._source.hasOwnProperty('metadata')) {
            try {
                let packageName = NPM_PACKAGE_PREFIX + searchList[i]._source.metadata.name;
                let npmTotalDownloads = 0;
                let npmResponse = await getNpmStats(packageName, NPM_STATS_START_DATE, CURR_DATE);
                npmTotalDownloads = npmResponse.body.downloads;
                element._source.npmDownloads = npmTotalDownloads;
                element._source.totalDownloads += npmTotalDownloads;
            } catch (err) {
                console.error("Error Updating Download data for Package :" + packageName 
                + " Reason: " + JSON.stringify(err));
            }
        }
        modifiedList.push(element);
    }
    return modifiedList;
}
/**
 * Returns the download stats from NPM for a particular package within a specified period.
 * @param {String} pkg 
 * @param {String} start 
 * @param {String} end 
 * @returns {Object} 
 */
async function getNpmStats(pkg, start, end) {
    const url = `https://api.npmjs.org/downloads/point/${start}:${end}/${pkg ? pkg : ""}`;
    try {
        const { res, body } = await request
            .get(url)
            .timeout({
                response: 3 * 1000,
                deadline: 5 * 1000,
            });
        if (!res && res.hasOwnProperty('statusCode') && res.statusCode === 400) {
            throw new Error("Error retrieving details from NPM API");
        }       
        return {
            statusCode: res.statusCode,
            body: body,
        };
    } catch (err) {
        throw err;
    }
}

export default {
    updateDownloadStats,
    getNpmStats
};

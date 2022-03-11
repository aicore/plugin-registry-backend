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

const REGISTERED_CLIENT_IDS = process.env.REGISTERED_CLIENT_IDS.split(", ");

async function validateGetPluginsRequest(req) {
    let clientIP= req.headers["x-real-ip"] || req.headers['X-Forwarded-For'] || req.socket.remoteAddress;

    console.log("Received getPluginsRequest from clientIP :" + clientIP);

    const validationResponse = {
        isValid: true,
        statusCode: 200,
        errorMessage: ""
    };

    if (!req.body || !req.body.hasOwnProperty("assetType") || !req.body.hasOwnProperty("clientID")) {
        validationResponse.isValid = false;
        validationResponse.statusCode = 400;
        validationResponse.errorMessage = "Invalid Argument: clientID & assetType are mandatory parameters.";
        return validationResponse;
    }

    if (!REGISTERED_CLIENT_IDS.includes(req.body["clientID"])) {
        validationResponse.isValid = false;
        validationResponse.statusCode = 403;
        validationResponse.errorMessage = "AuthenticationError: Not Authorised to access getPlugins API.";
    }

    return validationResponse;
}

async function validateSearchRequest(req) {
    let clientIP= req.headers["x-real-ip"] || req.headers['X-Forwarded-For'] || req.socket.remoteAddress;

    console.log("Received getPluginsRequest from clientIP : " + clientIP + " Request : " + JSON.stringify(req.body));

    const validationResponse = {
        isValid: true,
        statusCode: 200,
        errorMessage: ""
    };

    if (!req.body || !req.body.hasOwnProperty("query") || !req.body.hasOwnProperty("clientID")) {
        validationResponse.isValid = false;
        validationResponse.statusCode = 400;
        validationResponse.errorMessage = "Invalid Argument: clientID & query are mandatory parameters.";
        return validationResponse;
    }
    
    if (!REGISTERED_CLIENT_IDS.includes(req.body["clientID"])) {
        validationResponse.isValid = false;
        validationResponse.statusCode = 403;
        validationResponse.errorMessage = "AuthenticationError: Not Authorised to access getPlugins API.";
    }

    return validationResponse;
}

export default {
    validateGetPluginsRequest,
    validateSearchRequest
};
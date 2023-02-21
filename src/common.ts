// import * as https from 'https';
// import { PROJECT_URL, PROJECT_HOSTNAME, TOKEN, API_VER, PROJECT } from './settings';
import * as adoApi from 'azure-devops-node-api';
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

/*
function adoHttpsGet(url: string, suffix = API_VER): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get({
            hostname: PROJECT_HOSTNAME,
            path: PROJECT_URL + url + suffix,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + base64Encode(':' + TOKEN)
            }
            }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function adoHttpsPost(url: string, body: string, suffix = API_VER): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = https.request(PROJECT_HOSTNAME + PROJECT_URL + url + suffix, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length,
                'Authorization': 'Basic ' + base64Encode(':' + TOKEN)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
        req.write(body);
        req.end();
    });
}

function base64Encode(str: string): string {
    return Buffer.from(str).toString('base64');
}
*/

function getEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    return val;
}

export async function getWebApi(serverUrl?: string): Promise<adoApi.WebApi> {
    serverUrl = serverUrl || getEnv("API_URL");
    return await getApi(serverUrl);
}

export async function getApi(serverUrl: string): Promise<adoApi.WebApi> {
    return new Promise<adoApi.WebApi>(async (resolve, reject) => {
        try {
            let token = getEnv("API_TOKEN");
            let authHandler = adoApi.getPersonalAccessTokenHandler(token);
            let option = undefined;

            let vsts: adoApi.WebApi = new adoApi.WebApi(serverUrl, authHandler, option);
            let connData: lim.ConnectionData = await vsts.connect();
            // console.log(`Hello ${connData.authenticatedUser?.providerDisplayName}`);
            resolve(vsts);
        }
        catch (err) {
            reject(err);
        }
    });
}

export function getProject(): string {
    return getEnv("API_PROJECT");
}

export function banner(title: string): void {
    console.log("=======================================");
    console.log(`\t${title}`);
    console.log("=======================================");
}

export function heading(title: string): void {
    console.log();
    console.log(`> ${title}`);
}

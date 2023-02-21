import { WebApi } from 'azure-devops-node-api';
import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { WorkItemErrorPolicy, WorkItemExpand } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { getProject, getWebApi } from './common';


export async function adoGetIdsFromWiql(query: string): Promise<number[]> {
    const projectId = getProject();
    const witApi: IWorkItemTrackingApi = await getWitClient();
    // run wiql query
    const result = await witApi.queryByWiql({ query }, { projectId });
    return (result.workItems || []).map(e => e.id).filter(e => e !== undefined) as number[];
}

/**
 * retrieve all work-items (optionally for a given date)
 * 
 * @param asOf (optional) date asOf which information is to be retrieved
 * @returns    Array of WorkItems
 */
export async function getWorkItems(workItemIds: number[]): Promise<any> {
    try {
        const witClient = await getWitClient();
        // Query the project to retreive the Id field for all workitems
        // const queryResult = await witClient.queryByWiql({ query: `select [System.Id] From WorkItems where [System.workItemType] = 'Hybrid Story' ${ASOF}` });

        // Map this into an array of number
        const batchedWorkItems = chunkArray(workItemIds, 200);

        const workItems: any[] = [];
        await Promise.all(batchedWorkItems.map(async ids => {
            workItems.push(...await getWorkItemsBatch(ids));
        }));
        return workItems;
    } catch (e) {
        console.error(e);
    }
}

/**
 * Retrieve a batch of (200?) WorkItems, calls ADO and maps the response
 * 
 * @param ids  An array of (max 200) WorkItems to retrieve
 * @param asOf (optional) date asOf which information is to be retrieved
 * @returns    An array of expanded WorkItems
 */
async function getWorkItemsBatch(ids: number[], asOf?: Date): Promise<any> {
    const witClient = await getWitClient();
    try {
        const items = await witClient.getWorkItems(
            ids,
            undefined,
            asOf,
            WorkItemExpand.All,
            WorkItemErrorPolicy.Omit
        );
        return items.filter(e => e);
    } catch (e) {
        console.error(e);
    }
}

export async function getWitClient(): Promise<IWorkItemTrackingApi> {
    const webApi: WebApi = await getWebApi();
    const witApi: IWorkItemTrackingApi = await webApi.getWorkItemTrackingApi();
    return witApi;
}

/**
 * Splits an array into an array of smaller arrays with no more chunkSize elements
 * 
 * @param a         The array to split
 * @param chunkSize The maximum number of elements in each chunk
 * @returns         A chunked array, of arrays T[] => T[][]
 */
export function chunkArray<T>(a: T[], chunkSize: number): T[][] {
    // Map this into an array of number
    const batchedWorkItems: T[][] = [];
    for (let i = 0; i < a.length; i += chunkSize) {
        const chunk = a.slice(i, i + chunkSize);
        batchedWorkItems.push(chunk);
    }
    return batchedWorkItems;
}
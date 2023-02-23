import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { getProject, getWitClient, getWorkItems } from './adoWit';
import { SendMailBody } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { njk } from './njk';
import { AssigneeWorkItemData, QueryResults } from './types';

/**
 * Group query results by assignee; filter each data property by assignee's work items
 * And then send an email to each assignee, using the specified template
 * 
 * @param template   Njk template to use for email body
 * @param data       Query results, keyed by query name
 * @param cc         Array of tfIds to CC
 * @param onlySendTo Filter to apply prior to sending emails
 */
export async function groupAndSendToAssignees(template: string, data: QueryResults, cc: string[] = [], onlySendTo?: string[]): Promise<void> {

    // Combne the IDs from all queries into a single sorted array with duplicates removed
    const workItemIds = [...new Set(Object.values(data).flat())].sort(sortAsc);

    // Group work items by assignee, filter each data property by assignee's work items
    // And then send an email to each assignee, using the specified template
    groupWorkItemsByAssignee(await getWorkItems(workItemIds)).forEach(async assignee => {

        // Filter each data property by assignee's work items
        // The data object is added to the context for njk rendering
        const filteredData: QueryResults = {};
        Object.assign(filteredData, data);
        Object.keys(filteredData).forEach(key => {
            filteredData[key] = filteredData[key].filter((id: number) => assignee.workItemIds.includes(id));
        });
        assignee = { ...assignee, ...filteredData };


        if (assignee.workItemIds.length > 0 && assignee.id !== undefined) {
            if (onlySendTo === undefined || onlySendTo.includes(assignee.id)) {
                console.log('Sending email', assignee);
                await sendWorkItemEmail(
                    `ADO Test Email: ${assignee.name}`,
                    template,
                    assignee,
                    cc
                );
            } else {
                console.log('Skipping email', assignee);
            }
        } else {
            console.log('Skipping email', assignee);
        }
    })
}

/***
 * Group work items by assignee and return an array of AssigneeWorkItems
 * each AssigneeWorkItems contains the assignee's name, email, id, and workitem ids
 */
export function groupWorkItemsByAssignee(workItems: any): AssigneeWorkItemData[] {
    return workItems
        .map((wi: any) => ({
            name: wi.fields['System.AssignedTo']?.displayName,
            email: wi.fields['System.AssignedTo']?.uniqueName,
            id: wi.fields['System.AssignedTo']?.id
        }))
        .filter((v: any, i: number, a: any[]) => a.findIndex((e: any) => v.id === e.id) === i)
        .map((assignee: any) => ({
            ...assignee,
            workItemIds: workItems
                .filter((wi: any) => wi.fields['System.AssignedTo']?.id === assignee.id)
                .map((wi: any) => wi.id)
        }))
}

/**
 * Use the ADO API to send an workitem notification email
 * 
 * @param subject  Email subject
 * @param template Njk template to use, relative to the templates directory
 * @param data     Context data for the njk template
 * @param cc       Array of tfIds to CC
 */
export async function sendWorkItemEmail(
    subject: string,
    template: string,
    data: AssigneeWorkItemData,
    cc: string[] = []
): Promise<void> {
    const projectId = getProject();
    const witApi: IWorkItemTrackingApi = await getWitClient();

    const mailBody: SendMailBody = {
        message: {
            to: {
                tfIds: [data.id]
            },
            cC: {
                tfIds: cc
            },
            replyTo: {},
            body: await njk(template, data),
            subject,
        },
        ids: data.workItemIds,
        fields: [
            'System.WorkItemType',
            'System.AssignedTo',
            'System.ChangedDate',
            'System.Tags'
        ],
        projectId
    }

    await witApi.sendMail(mailBody);
}


function sortAsc(a: number, b: number) {
    return a - b;
}
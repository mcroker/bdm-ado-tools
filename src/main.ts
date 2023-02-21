import { SendMailBody } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi";
import { adoGetIdsFromWiql, getWitClient, getWorkItems } from "./adoWit"
import { getProject } from "./common";

const MCROKER_ID = '0fc1d223-916f-6668-89f8-3524c088d38b';
(async () => {

    const ids = await adoGetIdsFromWiql(`
    SELECT [System.Id]
    FROM workitems
    WHERE  [System.WorkItemType] IN ('Project Risk', 'Project Issue')
    ORDER BY [System.AssignedTo]
    `);
    // AND [System.ChangedDate] < @Today - 7
    // AND [System.State] = '11-Open' 

    const OK_IDs = [MCROKER_ID];
    groupWorkItemsByAsignee(await getWorkItems(ids)).forEach(async asignee => {
        if (asignee.workItemIds.length > 0 && asignee.id !== undefined && OK_IDs.includes(asignee.id)) {
            console.log('Sending email', asignee);
            await sendWorkItemEmail(
                asignee.id,
                `ADO Test Email: ${asignee.name}`,
                `
${asignee.name},
You have a number of RAIDD items within ADO that need your attention, as they exceed the project SLAs.
 * Not having been updated within the last 7 days

Please review the following items and update them as appropriate.

Thanks,
BDM PMO Team
        `,
                asignee.workItemIds
            );
        }
    })

})()

function groupWorkItemsByAsignee(workItems: any): { name: string, email: string, id: string, workItemIds: number[] }[] {
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

export async function sendWorkItemEmail(to: string, subject: string, body: string, ids: number[]): Promise<void> {
    const projectId = getProject();
    const witApi: IWorkItemTrackingApi = await getWitClient();

    const mailBody: SendMailBody = {
        message: {
            to: {
                tfIds: [to]
            },
            cC: {
                tfIds: [MCROKER_ID]
            },
            replyTo: {},
            body,
            subject,
        },
        ids,
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

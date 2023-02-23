import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import * as nunjucks from 'nunjucks';
import { getProject, getWitClient, getWorkItems } from './adoWit';
import { SendMailBody } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';

export interface AssigneeWorkItems {
    name: string,
    email: string,
    id: string,
    workItemIds: number[]
}

export type AssigneeDataFn<T extends AssigneeWorkItems = AssigneeWorkItems> = (assignee: AssigneeWorkItems) => T;

export async function groupAndSendToAssignees(workItemIds: any, template: string, fn: AssigneeDataFn | undefined, cc: string[] = [], okIds?: string[]): Promise<void> {
    groupWorkItemsByAssignee(await getWorkItems(workItemIds)).forEach(async assignee => {
        if (fn !== undefined) {
            assignee = fn(assignee);
        }
        if (assignee.workItemIds.length > 0 && assignee.id !== undefined) {
            if (okIds === undefined || okIds.includes(assignee.id)) {
                console.log('Sending email', assignee);
                await sendWorkItemEmail(
                    assignee.id,
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

export async function sendWorkItemEmail(
    to: string,
    subject: string,
    template: string,
    data: AssigneeWorkItems,
    cc: string[] = []
): Promise<void> {
    const projectId = getProject();
    const witApi: IWorkItemTrackingApi = await getWitClient();

    const mailBody: SendMailBody = {
        message: {
            to: {
                tfIds: [to]
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

export function groupWorkItemsByAssignee(workItems: any): AssigneeWorkItems[] {
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

export async function njk(template: string, context: object = {}): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        nunjucks.configure({
            autoescape: false
        });
        console.log(__dirname);
        const env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader(__dirname + '/../templates'), { autoescape: false }
        );

        env.addFilter('yesno', function (b: boolean) {
            if (b) {
                return 'Yes'
            } else {
                return 'No'
            }
        });

        env.addFilter('join', function (b: (string | number)[]) {
            return (b || []).map(i => `${i}`).join(', ');
        });

        env.render(template, context,
            (err: Error | null, res: string | null) => {
                if (err || res === null) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}
import { getWiIdsWithoutOpenActions, getWiIdsWithoutUpdate } from "./bdmQueries";
import { AssigneeDataFn, AssigneeWorkItems, groupAndSendToAssignees } from "./adoEmail";

export interface EmailData extends AssigneeWorkItems {
    wiIdsRequiringUpdate: number[];
    wiIdsWithoutOpenActions: number[];
}

(async () => {
    // const x = await getTags();
    // console.log(JSON.stringify(x));
    await sendRAIDEmails();
})();

export const MCROKER_ID = '0fc1d223-916f-6668-89f8-3524c088d38b';

async function sendRAIDEmails() {

    const wiIdsRequiringUpdate = await getWiIdsWithoutUpdate();
    const wiIdsWithoutOpenActions = await getWiIdsWithoutOpenActions();

    const fn: AssigneeDataFn<EmailData> = (assignee: AssigneeWorkItems) => {
        return {
            ...assignee,
            wiIdsRequiringUpdate: wiIdsRequiringUpdate.filter(id => assignee.workItemIds.includes(id)),
            wiIdsWithoutOpenActions: wiIdsWithoutOpenActions.filter(id => assignee.workItemIds.includes(id))
        }
    }
    // R3
    // No open actions

    const ids = [...wiIdsRequiringUpdate, ...wiIdsWithoutOpenActions];

    await groupAndSendToAssignees(ids.sort(sortAsc), 'raid-nag.njk', fn, [MCROKER_ID], [MCROKER_ID]);

}

function sortAsc(a: number, b: number) {
    return a - b;
}


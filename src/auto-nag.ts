import { AssigneeDataFn, AssigneeWorkItems, groupAndSendToAssignees } from "./adoEmail";
import { adoGetIdsFromWiql } from "./adoWit";
import { njk } from "./njk";

export interface EmailData extends AssigneeWorkItems {
    wiIdsRequiringUpdate: number[];
    wiIdsWithoutOpenActions: number[];
    wiIdsNotUnderRelease: number[];
}

(async () => {
    // const x = await getTags();
    // console.log(JSON.stringify(x));
    await sendRAIDEmails();
})();

export const MCROKER_ID = '0fc1d223-916f-6668-89f8-3524c088d38b';
export const VALERIE_ID = '9a89de09-8984-62a7-a1e8-d071dadf4c77';

async function sendRAIDEmails() {

    const wiIdsRequiringUpdate = await adoGetIdsFromWiql(await njk('wiqlWithoutUpdate.njk'));
    const wiIdsWithoutOpenActions = await adoGetIdsFromWiql(await njk('wiqlWithoutOpenActions.njk'));
    const wiIdsNotUnderRelease = await adoGetIdsFromWiql(await njk('wiqlNotUnderRelease.njk'));

    const fn: AssigneeDataFn<EmailData> = (assignee: AssigneeWorkItems) => {
        return {
            ...assignee,
            wiIdsRequiringUpdate: wiIdsRequiringUpdate.filter(id => assignee.workItemIds.includes(id)),
            wiIdsWithoutOpenActions: wiIdsWithoutOpenActions.filter(id => assignee.workItemIds.includes(id)),
            wiIdsNotUnderRelease: wiIdsNotUnderRelease.filter(id => assignee.workItemIds.includes(id))
        }
    }

    const ids = [...wiIdsRequiringUpdate, ...wiIdsWithoutOpenActions, ...wiIdsNotUnderRelease];

    await groupAndSendToAssignees(ids.sort(sortAsc), 'raid-nag.njk', fn, [MCROKER_ID], [MCROKER_ID]);

}

function sortAsc(a: number, b: number) {
    return a - b;
}


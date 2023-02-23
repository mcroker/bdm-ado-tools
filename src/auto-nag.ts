import { groupAndSendToAssignees } from "./adoEmail";
import { adoGetIdsFromWiql } from "./adoWit";
import { njk } from "./njk";
import { QueryList, QueryResults } from "./types";

/**
 * Main function
 */
(async () => {
    const MCROKER_ID = '0fc1d223-916f-6668-89f8-3524c088d38b';
    // const VALERIE_ID = '9a89de09-8984-62a7-a1e8-d071dadf4c77';
    await sendRAIDEmails([MCROKER_ID], [MCROKER_ID]);
})();

/**
 * Query ADO WIQL API and send emails to assignees
 * 
 * @param cc         Array of tfIds to CC  
 * @param onlySendTo Filer to apply to assignees prior to sending emails, 
 *                   if provided other emails are skipped
 */
async function sendRAIDEmails(cc: string[] = [], onlySendTo?: string[]) {
    // Execute all queries and return a data object of the results using the same keys as the queries
    // Queries are defined in the templates folder. Each query returns a lsit of IDs
    const data = await executeWiqlQueries({
        wiqlWithoutUpdate: 'wiqlWithoutUpdate.njk',
        wiqlWithoutOpenActions: 'wiqlWithoutOpenActions.njk',
        wiqlNotUnderRelease: 'wiqlNotUnderRelease.njk'
    });

    // Send an email to each assignee, using the specified template
    await groupAndSendToAssignees('raid-nag.njk', data, cc, onlySendTo);
}

/**
 * Execute a series of WIQL queries (in parallel) and return the results as an object
 * 
 * @param   queries  Object of njk template filesname, keyed by query name
 * @param   context  Context object to pass to njk rendering
 * @returns query results object, keyed by query name
 */
async function executeWiqlQueries(queries: QueryList, context: { [key: string]: any } = {}): Promise<QueryResults> {
    const data: { [key: string]: number[] } = {};
    await Promise.all(
        Object.entries(queries)
            .map(async ([key, wiqlTemplate]) => {
                data[key] = await adoGetIdsFromWiql(await njk(wiqlTemplate, context));
            })
    );
    return data;
}

import { adoGetIdsFromWiql } from "./adoWit";

const RISK = 'Project Risk';
const ISSUE = 'Project Issue';
const DECISION = 'Project Decision';
const ACTION = 'Project Action';
const BUG = 'Bug';

const VALID_IT_PATHS = ['BDC\\OAS\\R1', 'BDC\\OAS\\R2'];

export function getWiIdsNotUnderRelease(releases: string[] = VALID_IT_PATHS): Promise<number[]> {
    return adoGetIdsFromWiql(`
    SELECT [System.Id]
    FROM workitems
    WHERE [System.WorkItemType] IN ${wiqlIn([RISK, ISSUE, DECISION, BUG])}
    ${releases.map(i => `AND [System.IterationPath] NOT UNDER '${i}'`).join(' ')}
    AND [System.State] = '11-Open' 
    ORDER BY [System.AssignedTo]
    `);
}

export function getWiIdsWithoutUpdate(days: number = 7): Promise<number[]> {
    return adoGetIdsFromWiql(`
    SELECT [System.Id]
    FROM workitems
    WHERE [System.WorkItemType] IN ${wiqlIn([RISK, ISSUE, DECISION])}
    AND [System.ChangedDate] < @Today - ${days}
    AND [System.State] = '11-Open' 
    ORDER BY [System.AssignedTo]
    `);
}

export function getWiIdsWithoutOpenActions(): Promise<number[]> {
    return adoGetIdsFromWiql(`
    SELECT
        [System.Id],
        [System.Title],
        [System.State],
        [System.IterationPath]
    FROM workitemLinks
    WHERE (
        [Source].[System.TeamProject] = @project
        AND [Source].[System.WorkItemType] IN ${wiqlIn([RISK, ISSUE])}
        AND [Source].[System.State] = '11-Open'
        )
    AND (
        [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
    )
    AND (
        [Target].[System.TeamProject] = @project
        AND [Target].[System.WorkItemType] = 'Project Action'
        AND [Target].[System.State] = '11-Open'
    )
    MODE (DoesNotContain)
    `);
}

export function wiqlIn(a: string[]) {
    return '(' + a.map(i => "'" + i + "'").join(', ') + ')';
}
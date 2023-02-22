import { adoGetIdsFromWiql } from "./adoWit";

const RAID_WI_TYPES = "('Project Risk', 'Project Issue', 'Project Decision')";

export function getWiIdsWithoutUpdate(days: number = 7): Promise<number[]> {
    return adoGetIdsFromWiql(`
    SELECT [System.Id]
    FROM workitems
    WHERE [System.WorkItemType] IN ${RAID_WI_TYPES}
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
        AND [Source].[System.WorkItemType] IN ${RAID_WI_TYPES}
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
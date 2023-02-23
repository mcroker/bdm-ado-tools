export interface AssigneeWorkItemData {
    name: string,
    email: string,
    id: string,
    workItemIds: number[]
}

export type QueryList = { [key: string]: string };
export type QueryResults = { [key: string]: number[] };

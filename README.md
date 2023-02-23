# bdm-ado-tools

## Overview

The POC uses the ADO API to query and send the emails; queries are written in the ADO WIQL language… examples here

It aggregates and sends a single combined email to each owner (based on AssignedTo field); flagging:

Risks/Issues that have not been updated in 7 days (based on ChangedDate)
Any open Risks/Issues that do not also have an open Action
Any Risk/Issue/Decision/Bug work items that are not under either BDC\OAS\R1 or BDC\OAS\R2
 
These were just the criteria I decided to test in the POC; it would not be hard to extend to other queries or even to do actions such as:

Close a Draft Risk/Issue if it has not been updated for 14 days (having warned at 7 days)
Tag issues which require update (although tagging is itself an update – so I am wary of doing this)

The email format is fairly constrained by ADO, but we can change the columns, and add a pain-text notes section at the top (sample email below)

## Installation

```
npm install
```

Current the POC has my tfId hard-coded... in order not to spam me - replace this with yours and recompile
```
npm build
```

Prior to executiont the following enironment must be set
```
API_TOKEN=PersonalAccessTokenGoesHere
API_URL=https://dev.azure.com/vp-bd
API_PROJECT=BDC
```

## Execution

```
npm start
```
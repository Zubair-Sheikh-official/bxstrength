# Archify Workflow Diagrams — BxStrength Platform

This document presents the core business workflows of the BxStrength platform structured using **Archify Workflow Mode principles**:
- **Swimlane Architecture**: Separate lanes for distinct actors/owners (Client, Head Coach, Coach, Support, System).
- **Unmistakable Happy Path**: Prominently emphasized main workflow routes.
- **Unresolved & Exception Branch Tagging**: Explicitly marking missing ownership or unspecified decision paths (e.g. rejection loops, SLA timeouts) instead of inventing assumed logic.

---

## 1. 🏋️ Client Onboarding, Coaching Assignment & QA Approval Flow

```mermaid
flowchart TB
    subgraph LANE_CLIENT["👤 Client Lane"]
        C1["1.0 Client Registration & Lead Submission"]
        C2["5.0 Receive Brevo Email Alert & Access Dashboard Program"]
    end

    subgraph LANE_HEAD_COACH["👑 Head Coach Lane (Supervising Authority)"]
        HC1["2.0 Receive Lead in Central Assignment Engine"]
        HC2["2.1 Allocate Client to UK Specialist Coach"]
        HC3{"4.0 QA Review: Plan Approved?"}
    end

    subgraph LANE_COACH["🏋️ Coach Lane (Assigned Specialist)"]
        CO1["3.0 Architect Tailored Workout & Nutrition Blueprint"]
        CO2["3.1 Submit Draft Plan to Head Coach for QA"]
        UNRESOLVED_REV["⚠️ [? Unresolved Branch: Rejection / Revision Workflow]"]
    end

    subgraph LANE_SYSTEM["⚙️ System & Email Gateway"]
        SYS1["4.1 Sync & Publish Program to Client Database"]
        SYS2["4.2 Dispatch Transactional Email via Brevo Gateway"]
        UNRESOLVED_FAIL["⚠️ [? Unresolved Branch: Email Gateway Delivery Failure / Fallback]"]
    end

    %% Happy Path Flow (Bold / Thick Connections)
    C1 ==> HC1
    HC1 ==> HC2
    HC2 ==> CO1
    CO1 ==> CO2
    CO2 ==> HC3
    HC3 ==>|Yes (Approved)| SYS1
    SYS1 ==> SYS2
    SYS2 ==> C2

    %% Unresolved & Exception Paths
    HC3 -.->|No (Rejected / Changes Requested)| UNRESOLVED_REV
    SYS2 -.->|Delivery Failure| UNRESOLVED_FAIL
```

### Flow Breakdown & Missing Specifications

| Step | Actor / Lane | Action | Status / Notes |
| :--- | :--- | :--- | :--- |
| **1.0** | Client | Registers or submits service inquiry | **Happy Path Start** |
| **2.0–2.1** | Head Coach | Reviews incoming lead & assigns dedicated UK Coach | Central Assignment Engine |
| **3.0–3.1** | Coach | Builds custom workout program & nutrition blueprint | Submitted for QA |
| **4.0** | Head Coach | QA Review & Approval | **Decision Point** |
| **4.0 (No)** | Head Coach / Coach | Rejection / Revision | ⚠️ **Unresolved**: Return loop to Coach for revision is not explicitly specified in specs. |
| **4.1–4.2** | System | Syncs to Client DB & dispatches Brevo email | Automated Trigger |
| **5.0** | Client | Receives email notification & views plan | **Happy Path End** |

---

## 2. 🎧 Customer Support Inquiry & Escalation Flow

```mermaid
flowchart TB
    subgraph CS_CLIENT["👤 Client Lane"]
        SC1["1.0 Submit Health Inquiry / Support Ticket"]
        SC2["4.0 View Resolution & Ticket Status Update in Portal"]
    end

    subgraph CS_SUPPORT["🎧 Customer Support Desk Lane"]
        CS1["2.0 Review Ticket Priority & SLA Status"]
        CS2{"2.1 Complex Athletic / Technical Query?"}
        CS3["3.0 Standard Ticket Resolution & Direct Response"]
    end

    subgraph CS_HEAD_COACH["👑 Head Coach / Admin Escalation Lane"]
        HC_ESC["3.1 Athletic & High-Priority Technical Review"]
        UNRESOLVED_SLA["⚠️ [? Unresolved Branch: SLA Timeout / Unanswered Escalation]"]
    end

    subgraph CS_SYSTEM["⚙️ Real-time Ticket Engine"]
        SYS_TICK["3.2 Update Status in Support Desk & Client Ticket Center"]
    end

    %% Happy Path Flow
    SC1 ==> CS1
    CS1 ==> CS2
    CS2 ==>|No (Standard Query)| CS3
    CS2 ==>|Yes (Complex Athletic Request)| HC_ESC
    CS3 ==> SYS_TICK
    HC_ESC ==> SYS_TICK
    SYS_TICK ==> SC2

    %% Unresolved & Exception Paths
    HC_ESC -.->|SLA Exceeded / No Response| UNRESOLVED_SLA
```

### Flow Breakdown & Missing Specifications

| Step | Actor / Lane | Action | Status / Notes |
| :--- | :--- | :--- | :--- |
| **1.0** | Client | Submits ticket/inquiry via portal | **Happy Path Start** |
| **2.0–2.1** | Customer Support | Triage ticket priority & classify query type | **Decision Point** |
| **3.0** | Customer Support | Resolves standard inquiry directly | Standard Flow |
| **3.1** | Head Coach / Admin | Handles escalated complex athletic/tech ticket | Escalation Flow |
| **3.1 (Timeout)**| Head Coach / Admin | Response delay beyond SLA | ⚠️ **Unresolved**: SLA breach escalation fallback is not specified. |
| **3.2–4.0** | System / Client | Real-time status sync & client notification | **Happy Path End** |

---

> [!TIP]
> If you have a specific text description or additional workflow rules (e.g. payment gateway handling, subscription cancellation, or custom role permissions) you would like mapped into an Archify diagram, paste the text directly into the chat!

> Converted from `source/Calvin_2.0_production_document.docx` on 29 Sep 2026. The .docx is the original; this copy exists so tools can search it.

**CCA Selection Portal --- Production Document**

**Purpose:** Fair, transparent, unbiased and auditable selection of students into CCAs/AIGs\
**Total CCAs:** 35\
**Primary users:** Senate, CCAs, Students

**1. OBJECTIVE**

The CCA Selection Portal shall digitize and standardize the complete CCA selection process.

The core principles of the system shall be:

1.  **Transparency** --- Senate can see the complete process in real time.

2.  **Blindness of evaluation** --- Students cannot see marks awarded to them.

3.  **Immutability of marks** --- Once marks are submitted, they cannot be edited by the evaluator.

4.  **Process accountability** --- Every important action shall be time-stamped and attributable to a user.

5.  **Standardization** --- Every CCA must define its selection structure before students begin participating.

6.  **No post-hoc manipulation** --- Round structure, maximum marks and evaluation parameters should be locked once the selection process starts.

7.  **Central monitoring** --- Senate has complete visibility without participating in evaluation.

**2. THREE USER INTERFACES**

The system shall have three completely different interfaces.

  ---------------------------------------------------------------------------------
  **Interface**           **Primary User**     **Purpose**
  ----------------------- -------------------- ------------------------------------
  **Senate Dashboard**    Senate               Monitor entire selection process

  **CCA Dashboard**       CCA Selection Team   Configure and conduct selection

  **Student Dashboard**   Students             Apply and participate in selection
  ---------------------------------------------------------------------------------

**Access hierarchy**

**Senate**

Complete visibility + monitoring + audit

**CCA**

Configuration + execution + evaluation

**Student**

Application + participation + status tracking

**3. CORE SYSTEM ENTITIES**

The database should fundamentally contain the following entities:

-   Student

-   CCA

-   Vertical

-   Application

-   Selection Process

-   Round

-   Round Type

-   Group

-   Panel

-   Panel Member

-   Task

-   Submission

-   Interview

-   Evaluation

-   Marks

-   Selection Status

-   Audit Log

-   Notification

Relationship:

**CCA → Verticals → Seats**

**CCA → Selection Process → Rounds**

**Round → Panels**

**Panel → Panel Members**

**Student → Application → CCA + Vertical**

**Student → Round Participation → Task/Interview → Evaluation → Marks**

**4. CCA MASTER SETUP**

Before applications open, every CCA shall configure its selection process.

**CCA must provide:**

**A. CCA Information**

-   CCA Name

-   CCA Type

    -   Club

    -   Committee

    -   AIG

-   Total Strength of the CCA

-   CCA Description

-   Contact person

-   Selection coordinator(s)

**B. Vertical Configuration**

Each CCA shall specify its available verticals.

Example:

**Marketing Club**

  -----------------------------------------------------------------------
  **Vertical**                                  **Seats**
  --------------------------------------------- -------------------------
  Marketing                                     4

  Events                                        3

  Content                                       3

  Design                                        2
  -----------------------------------------------------------------------

For every vertical:

-   Vertical name

-   Description

-   Number of seats

**Total seats should be automatically calculated.**

**And also Sum of total seats in the verticals = total seat of the CCA**

**5. SELECTION ROUND CONFIGURATION**

The CCA must declare the **entire selection structure before the selection process begins.**

**Required information:**

-   Number of rounds

-   Sequence of rounds

-   Round name

-   Round type

-   Maximum marks

-   Expected End date of each round

-   Instructions

-   Evaluation criteria

**6. ROUND TYPES**

The system shall provide two primary categories:

**A. Individual Round**

Only one student participates.

Two subtypes:

1.  **Task Only**

2.  **Task + Interview**

**B. Group Round**

Multiple students participate together.

Two subtypes:

1.  **Task Only**

2.  **Task + Interview**

Therefore:

  --------------------------------------------------------------------------
  **Round**                         **Participation**   **Evaluation**
  --------------------------------- ------------------- --------------------
  Individual Task                   Individual          Task

  Individual Task + Interview       Individual          Task + Interview

  Group Task                        Group               Task

  Group Task + Interview            Group               Task + Interview
  --------------------------------------------------------------------------

Yes. These are important additions, and I would incorporate them into the production document as **two distinct mechanisms**:

1.  **Screening Round (Round 0)** --- optional pre-selection screening, available only when applications \> 50.

2.  **Post-round Elimination** --- after every scored round, the CCA may eliminate candidates, subject to the Senate-prescribed **2.5× minimum applicant pool rule**.

There is also one important implementation point: the **2.5× rule should be configurable by Senate**, rather than hard-coded, because Senate may later change the multiplier or disable the rule entirely.

**1. Applicant strength / elimination rule**

Suppose:

-   CCA constitutional strength = **10**

-   Senate multiplier = **2.5×**

-   Minimum candidates required at every stage = 10 × 2.5 = 25

After each completed round, the CCA sees candidates ranked by **system-generated total performance for that round** and can eliminate candidates from the bottom.

However:

**The system must not allow the CCA to eliminate candidates if doing so would reduce the remaining candidate pool below the Senate-prescribed minimum.**

For example:

  ------------------------------------------------------------------------------------------------------------------------------
  **Before Round**   **CCA Strength**   **Senate Multiplier**   **Minimum Required**   **CCA Can Retain**
  ------------------ ------------------ ----------------------- ---------------------- -----------------------------------------
  100                10                 2.5×                    25                     25 or more

  60                 10                 2.5×                    25                     25 or more

  30                 10                 2.5×                    25                     25 or more

  25                 10                 2.5×                    25                     **Cannot eliminate anyone**

  20                 10                 2.5×                    25                     **Process should not reach this state**
  ------------------------------------------------------------------------------------------------------------------------------

The system should calculate:

**Minimum Candidates Required = CCA Constitutional Strength × Senate Multiplier**

and display it prominently to the CCA.

If Senate changes the multiplier to, say, **2×**, the system automatically recalculates the threshold.

If Senate disables the rule:

**Minimum Candidate Multiplier = OFF**

and no minimum-pool restriction is applied.

**2. Elimination should happen only after the complete round evaluation**

The workflow should therefore be:

**Round Conducted → All Candidates Evaluated → Round Evaluation Locked → System Generates Ranking → CCA Selects Number to Eliminate → System Validates Minimum Pool → Elimination Confirmed → Next Round Opens**

Importantly, **CCA should not be able to manually select arbitrary students for elimination**.

The system should determine the ranking based on the locked marks, and elimination should proceed **from the bottom-most performers upward**.

This prevents a CCA from saying, for example:

\"We want to eliminate Student A even though Student A scored higher than Student B.\"

The interface could say:

**Candidates eligible for elimination are automatically identified from the bottom of the round ranking.**

The CCA then specifies **how many candidates to eliminate**, subject to the threshold.

**3. New Round Type: Screening Round / Round 0**

This should be treated as fundamentally different from the four regular rounds.

**Eligibility**

The **Screening Round option appears only when applications received \> 50**.

For example:

-   48 applications → Screening Round option **not available**

-   50 applications → Screening Round option **not available**

-   51 applications → Screening Round option **available**

The system should automatically enable the option once the application count crosses 50.

**Screening Round configuration**

The CCA can choose:

**Screening Round**

-   Task Only

-   Interview Only

There are **no marks** in this round.

Instead, evaluation is binary:

**PROMOTED / ELIMINATED**

So the configuration could look like:

  -----------------------------------------------------------------------
  **Field**                      **Screening Round**
  ------------------------------ ----------------------------------------
  Round Number                   0

  Round Type                     Screening

  Eligibility                    Applications \> 50

  Evaluation Method              Promoted / Eliminated

  Marks                          No

  Maximum Marks                  N/A

  Task                           Optional

  Interview                      Optional

  Ranking                        No marks-based ranking

  Purpose                        Initial applicant screening
  -----------------------------------------------------------------------

**Screening Round workflow**

If the CCA chooses **Task Only**:

Applications → Screening Task → Student Submission → CCA Evaluation → Promoted / Eliminated

If the CCA chooses **Interview Only**:

Applications → Interview → Student + Panel Enter → Interview Active → Student Completes → CCA Evaluation → Promoted / Eliminated → Panel Logs Out

The same interview-control mechanism we already established should apply:

**Student enters + Panel enters → Interview active → Student exits → evaluation unlocks → CCA decides Promoted/Eliminated → decision locked → panel exits.**

There should be **no marks field whatsoever** in the screening round.

**4. Screening Round and 2.5× rule**

This needs one explicit business rule in the PRD.

The Senate\'s minimum-strength rule should apply to the **candidate pool at every stage**, including after Round 0, **unless Senate explicitly configures an exception**.

For example:

CCA strength = 10\
Senate multiplier = 2.5×\
Minimum pool = 25

Applications = 80.

CCA conducts Screening Round and wants to eliminate 60.

The system must prevent this because:

80 − 60 = 20

and:

20 \< 25

Therefore the maximum permitted elimination is:

80 − 25 = 55

So the system should display:

**Maximum candidates that can be eliminated: 55**\
**Minimum candidates that must be retained: 25**

**5. Senate should control the rule**

I strongly recommend making this a **Senate-level global configuration**, rather than a CCA-level setting.

**Senate configuration**

**Candidate Pool Protection Rule**

  -----------------------------------------------------------------------
  **Setting**                                   **Value**
  --------------------------------------------- -------------------------
  Rule Status                                   ON/OFF

  Minimum Multiplier                            2.5×

  Applies to                                    All CCAs

  Effective From                                Configurable

  Modification Authority                        Senate
  -----------------------------------------------------------------------

Senate can therefore change:

2.5× → 2×

or:

2.5× → 3×

or:

Rule → OFF

The change should be recorded in the audit log.

However, I would add one important safeguard:

**A change in the Senate multiplier should not retroactively invalidate completed rounds.**

The system should store the applicable rule version against each round.

**6. Updated complete round architecture**

The production document should now distinguish **Screening Round** from **Regular Selection Rounds**.

**Round 0 --- Screening Round**

Available only if:

Applications \> 50

Options:

-   Screening --- Task Only

-   Screening --- Interview Only

Evaluation:

PROMOTED / ELIMINATED

No marks.

No ranking based on marks.

**Rounds 1 onward --- Regular Selection Rounds**

Four available types:

1.  **Individual --- Task Only**

2.  **Individual --- Task + Interview**

3.  **Group --- Task Only**

4.  **Group --- Task + Interview**

These use marks.

Example:

Maximum Marks = 20

Evaluator enters:

17.5

System locks the evaluation after submission.

**7. Updated selection lifecycle**

The overall system flow now becomes:

**CCA Registration**\
↓\
**Vertical & Seat Configuration**\
↓\
**Application Window Opens**\
↓\
**Applications Received**\
↓\
**Applications \> 50?**\
↓\
**YES → Screening Round Option Enabled**\
↓\
**CCA chooses whether to conduct Screening Round**\
↓\
**Round 0 --- Screening**\
↓\
**Promoted / Eliminated**\
↓\
**Minimum Pool Rule Validation**\
↓\
**Round 1 Configuration/Execution**\
↓\
**Task / Interview**\
↓\
**Complete Evaluation**\
↓\
**Marks Locked & Hidden**\
↓\
**Round Evaluation Completed**\
↓\
**System Generates Performance Ranking**\
↓\
**CCA Chooses Number of Eliminations**\
↓\
**2.5× / Senate Rule Validation**\
↓\
**Elimination Locked**\
↓\
**Next Round**\
↓\
**Complete Evaluation**\
↓\
**Elimination Decision**\
↓\
**Next Round\...**\
↓\
**Final Round**\
↓\
**Final Ranking**\
↓\
**Selection**\
↓\
**Senate Monitoring / Ratification**

**8. One particularly important rule for developers**

I would put this in the PRD almost verbatim:

**The CCA has discretion over the number of candidates it wishes to eliminate after a completed evaluation round, but it does not have discretion over which candidates are eliminated. Candidate elimination must be system-generated from the bottom of the performance ranking based on locked evaluation scores. The system shall prevent any elimination that causes the remaining candidate pool to fall below the minimum candidate strength prescribed by Senate.**

And for the screening round:

**The Screening Round is an optional Round 0 available exclusively to CCAs whose application count exceeds 50. The Screening Round may consist of either a task or an interview and shall use only a binary Promoted/Eliminated outcome. No marks shall be recorded, displayed, ranked, or stored for the purpose of scoring in a Screening Round.**

This makes the distinction between **CCA discretion** and **CCA manipulation** very clear---which is especially important given the Senate\'s objective of making the portal fair and auditable.

**7. MAXIMUM MARKS**

Maximum marks must be defined **before the round starts**.

Example:

  ------------------------------------------------------------------------
  **Round**        **Component**          **Maximum Marks**
  ---------------- ---------------------- --------------------------------
  Round 1          Task                   20

  Round 2          Task                   30

  Round 2          Interview              20

  Round 3          Interview              30

  **Total**                               **100**
  ------------------------------------------------------------------------

**Critical rule**

Once the selection process starts:

**Maximum marks cannot be changed by the CCA.**

The Senate should be able to see the originally declared maximum marks.

Any attempt to modify them after locking should be rejected by the system and recorded in the audit log.

**8. ROUND CONFIGURATION LOCK**

Before the first student participates, CCA must submit the **Final Selection Structure**.

The CCA clicks:

**FINALIZE SELECTION STRUCTURE**

The system displays a confirmation:

\"Once finalized, round sequence, round types and maximum marks cannot be modified after the selection process begins.\"

CCA confirms.

Status changes:

**Draft → Finalized**

Once the first round begins:

**Finalized → Locked**

**9. PANEL CONFIGURATION**

Before a round begins, the CCA must configure its evaluation panels.

CCA shall specify:

**Number of panels**

Example:

Number of panels = 4

Then configure each panel.

**Panel 1**

-   Panel strength: 3

-   Member 1: Student/Member X

-   Member 2: Student/Member Y

-   Member 3: Student/Member Z

**Panel 2**

-   Panel strength: 3

-   Member 1

-   Member 2

-   Member 3

etc.

**10. PANEL RULES**

Each panel should have:

-   Unique Panel ID

-   Round ID

-   Panel members

-   Assigned students/groups

-   Panel status

Example:

**Round 2 --- Interview**

  ------------------------------------------------------------------------
  **Panel**         **Members**                 **Students**
  ----------------- --------------------------- --------------------------
  P1                A, B, C                     S1--S10

  P2                D, E, F                     S11--S20

  P3                G, H, I                     S21--S30
  ------------------------------------------------------------------------

**Important**

Panel configuration must be completed **before evaluation starts**.

After a panel has started evaluating students, its membership should be locked.

Any exceptional change should require **Senate authorization** and generate an audit entry.

**11. STUDENT APPLICATION INTERFACE**

The student logs into the portal using institutional authentication.

Student dashboard displays:

**Available CCAs**

Each CCA card should show:

-   CCA name

-   Description

-   Available verticals

-   Seats

-   Selection rounds

-   Important dates

-   Application status

**12. STUDENT APPLICATION**

Student selects:

**CCA**

Example:

Consulting Club

Then selects:

**Preferred Vertical**

Example:

Strategy

The application records:

-   Student ID

-   CCA

-   Vertical

-   Application timestamp

-   Application status

Possible status:

**Not Applied → Applied → Participating → Selected / Not Selected**

**13. MULTIPLE CCA APPLICATIONS**

If institutional policy permits students to apply to multiple CCAs, the system should support multiple applications.

Each application must remain an independent record.

Example:

Student A:

  ------------------------------------------------------------------------
  **CCA**                      **Vertical**        **Status**
  ---------------------------- ------------------- -----------------------
  Consulting Club              Strategy            Participating

  Marketing Club               Marketing           Selected

  Finance Club                 Research            Participating
  ------------------------------------------------------------------------

This allows Senate to monitor cross-CCA participation.

**14. STUDENT ROUND INTERFACE**

When a round opens, the student\'s dashboard displays:

**Round 2 --- Task + Interview**

Status:

**ROUND ACTIVE**

Student can see:

-   Round name

-   Round type

-   Instructions

-   Deadline

-   Task

-   Submission facility

-   Interview schedule, if applicable

-   Panel location/link, if applicable

**Student cannot see:**

-   Marks

-   Panel evaluation

-   Other students\' marks

-   Ranking

-   Evaluator comments, unless the policy explicitly permits this

**15. TASK SUBMISSION**

For task-based rounds:

Student uploads/submits the task.

System records:

-   Submission

-   Timestamp

-   File/document

-   Submission status

Possible statuses:

**Not Started**

→ **In Progress**

→ **Submitted**

→ **Late Submitted**

→ **Closed**

After submission, student should receive:

\"Your submission has been successfully recorded.\"

The system must record the **exact submission timestamp**.

**Yes. This changes the interview workflow and locking logic importantly. I would add the following as the definitive production specification, replacing the earlier generic interview workflow.**

**16. Interview Session Control --- Mandatory Workflow**

**An interview shall be treated as an active controlled session between:**

-   **Student**

-   **CCA Panel**

**Both parties must be logged into the portal.**

**The system shall maintain a live status for the interview.**

**Interview lifecycle**

**INTERVIEW SCHEDULED**

**↓**

**STUDENT ENTERS**

**↓**

**CCA PANEL ENTERS**

**↓**

**INTERVIEW ACTIVE**

**↓**

**STUDENT LOGS OUT / COMPLETES INTERVIEW**

**↓**

**CCA PANEL ENTERS MARKS**

**↓**

**MARKS SUBMITTED & LOCKED**

**↓**

**MARKS HIDDEN FROM CCA**

**↓**

**CCA PANEL LOGS OUT**

**↓**

**PANEL AVAILABLE FOR NEXT INTERVIEW**

**17. Interview Entry**

**For every scheduled interview, the system shall create an Interview Session ID.**

**Example:**

**Interview Session: INT-002341\
Student: Student A\
CCA: Consulting Club\
Round: Round 3\
Panel: Panel 2**

**Student**

**The student clicks:**

**ENTER INTERVIEW**

**System records:**

**Student Entered --- 10:00:14**

**CCA Panel**

**The panel clicks:**

**START INTERVIEW**

**System records:**

**Panel Entered --- 10:00:27**

**Only after both have entered should the interview status become:**

**INTERVIEW ACTIVE**

**18. Interview Status**

**The system should display:**

**Student side**

**🟢 You are currently in an interview**

**Panel side**

**🟢 Interview in Progress --- Student A**

**The Senate can simultaneously see:**

**Panel 2 --- Student A --- Interview Active**

**19. Student Must Exit Before Evaluation**

**This is a mandatory business rule.**

**The CCA must not be allowed to enter or submit marks while the student is still inside the interview session.**

**The evaluation button should remain disabled:**

**ENTER MARKS --- Disabled**

**until the student has completed/logged out of the interview.**

**20. Student Interview Completion**

**Once the interview is over, the student clicks:**

**INTERVIEW COMPLETED / EXIT INTERVIEW**

**The system records:**

-   **Student ID**

-   **Interview Session ID**

-   **Timestamp**

-   **Student exit status**

**Status becomes:**

**Student --- Interview Completed**

**The CCA panel remains inside the session.**

**21. CCA Evaluation Unlock**

**Once the student has exited:**

**Student Status = COMPLETED**

**+**

**Panel Status = ACTIVE**

**↓**

**EVALUATION UNLOCKED**

**The panel now receives the option:**

**ENTER MARKS**

**Before this point:**

**❌ Marks cannot be entered.**

**After this point:**

**✓ Marks can be entered.**

**22. CCA Marks Entry**

**For an individual interview:**

**Student A**

**Maximum Marks: 30**

**Marks Awarded: \[\_\_\_\_\]**

**For a group interview:**

  -----------------------------------------------------------------------
  **Student**                **Maximum**                **Marks**
  -------------------------- -------------------------- -----------------
  **Student A**              **30**                     **\_\_\_**

  **Student B**              **30**                     **\_\_\_**

  **Student C**              **30**                     **\_\_\_**
  -----------------------------------------------------------------------

**The panel submits the evaluation through:**

**SUBMIT & LOCK MARKS**

**23. Immediate Mark Locking**

**Immediately upon confirmation:**

**Marks Entered**

**↓**

**Confirm**

**↓**

**MARKS LOCKED**

**↓**

**CCA MARK VISIBILITY = FALSE**

**The CCA should not even be able to reopen the submitted evaluation screen to view the marks.**

**Instead, the panel sees:**

**Evaluation submitted successfully.\
Marks have been locked and are no longer accessible.**

**24. CCA Panel Exit**

**After marks have been successfully locked, the panel receives:**

**EXIT / LOG OUT FROM INTERVIEW**

**This option should not be available before marks have been submitted and locked.**

**Therefore:**

**Student exits**

**↓**

**CCA enters marks**

**↓**

**CCA submits marks**

**↓**

**Marks locked**

**↓**

**Marks hidden**

**↓**

**CCA panel can exit**

**25. Panel Availability Lock**

**This is a particularly important control.**

**A panel that is currently conducting an interview must be considered:**

**BUSY**

**The panel cannot start another interview while it is still associated with the current active interview session.**

**Panel state:**

**AVAILABLE**

**↓**

**INTERVIEW ACTIVE**

**↓**

**STUDENT COMPLETED**

**↓**

**EVALUATION PENDING**

**↓**

**MARKS LOCKED**

**↓**

**PANEL LOGGED OUT**

**↓**

**AVAILABLE**

**Only the final state makes the panel available for another interview.**

**26. Next Interview Restriction**

**The system must technically prevent the panel from taking another interview until it has completed the entire current workflow.**

**For example:**

**Panel 2**

**Current student:**

**Student A**

**Status:**

**🔴 Evaluation Pending**

**The panel attempts to open Student B.**

**System should reject the action:**

**Panel unavailable. Please complete the current interview, submit and lock the evaluation, and exit the interview session before proceeding to the next interview.**

**27. Critical Sequence Rule**

**The system should enforce the following exact sequence:**

**STEP 1**

**Student enters interview.**

**STEP 2**

**CCA panel enters interview.**

**STEP 3**

**Interview becomes ACTIVE.**

**STEP 4**

**Interview takes place.**

**STEP 5**

**Student exits/completes interview.**

**STEP 6**

**CCA evaluation becomes available.**

**STEP 7**

**CCA enters marks.**

**STEP 8**

**CCA confirms marks.**

**STEP 9**

**Marks are permanently locked.**

**STEP 10**

**Marks immediately become hidden from CCA.**

**STEP 11**

**CCA panel exits/logs out of interview.**

**STEP 12**

**Panel status becomes AVAILABLE.**

**STEP 13**

**Panel can now take the next interview.**

**28. Senate Monitoring**

**The Senate should be able to see the state of every interview in real time, but students and CCA should not see Senate\'s monitoring interface.**

**Example:**

  ------------------------------------------------------------------------------------------------
  **CCA**     **Panel**   **Student**   **Interview Status**   **Evaluation**   **Panel Status**
  ----------- ----------- ------------- ---------------------- ---------------- ------------------
  **CCA 1**   **P1**      **S001**      **Active**             **Locked**       **Busy**

  **CCA 1**   **P2**      **S002**      **Student exited**     **Pending**      **Busy**

  **CCA 1**   **P3**      **S003**      **Completed**          **Locked**       **Available**

  **CCA 2**   **P1**      **S004**      **Scheduled**          **---**          **Available**
  ------------------------------------------------------------------------------------------------

**This is particularly useful for Senate because it allows them to identify exactly where a process is stuck.**

**29. Senate Should Also See Timestamps**

**For each interview:**

  -----------------------------------------------------------------------
  **Event**                                        **Timestamp**
  ------------------------------------------------ ----------------------
  **Student entered**                              **10:00:14**

  **Panel entered**                                **10:00:27**

  **Interview became active**                      **10:00:27**

  **Student exited**                               **10:23:42**

  **Marks submitted**                              **10:27:11**

  **Marks locked**                                 **10:27:11**

  **Panel exited**                                 **10:28:03**

  **Panel available**                              **10:28:03**
  -----------------------------------------------------------------------

**This provides a strong audit trail if a dispute occurs.**

**30. Group Interview Modification**

**The same logic applies to group interviews.**

**Suppose:**

**Group G12**

**contains:**

-   **S01**

-   **S02**

-   **S03**

-   **S04**

**All students enter the interview.**

**After the interview, all students must be marked as having exited/completed the interview before evaluation becomes available.**

**Then:**

**Panel evaluates S01--S04.**

**Once the complete evaluation is submitted:**

**All marks locked and hidden.**

**Then:**

**Panel exits.**

**Only after panel exit:**

**Panel = AVAILABLE**

**31. Handling Exceptional Cases**

**There should be a Senate-controlled override for situations such as:**

-   **Student\'s internet connection fails**

-   **Student\'s device crashes**

-   **Student forgets to click exit**

-   **Panel\'s system crashes**

-   **Student leaves unexpectedly**

-   **Interview has to be terminated**

-   **Panel member becomes unavailable**

**The CCA should not have the ability to bypass the workflow themselves.**

**Instead:**

**RAISE EXCEPTION**

**CCA submits:**

-   **Issue**

-   **Student**

-   **Interview ID**

-   **Explanation**

**Senate can then resolve/override the session.**

**Every override must be logged.**

**32. Most Important Technical Requirement**

**I would explicitly tell the website development team:**

**The interview workflow must be implemented as a backend state machine. The restrictions must not be implemented merely through front-end button visibility.**

**For example, simply hiding the \"Enter Marks\" button is insufficient.**

**Even if someone attempts an API request manually:**

**POST /evaluation**

**the backend should reject it if:**

**student_interview_status != COMPLETED**

**Similarly, the backend should reject:**

**START_NEXT_INTERVIEW**

**if:**

**panel_status != AVAILABLE**

**This is critical for maintaining the integrity of the selection process.**

**Final Interview State Machine**

**┌──────────────────┐**

**│ SCHEDULED │**

**└────────┬─────────┘**

**↓**

**Student + Panel Enter**

**↓**

**┌──────────────────┐**

**│ INTERVIEW ACTIVE │**

**└────────┬─────────┘**

**↓**

**Student Completes**

**↓**

**┌─────────────────────────┐**

**│ EVALUATION UNLOCKED │**

**│ Panel still ACTIVE │**

**└───────────┬─────────────┘**

**↓**

**Enter Marks**

**↓**

**Confirm & Submit**

**↓**

**┌──────────────────┐**

**│ MARKS LOCKED │**

**└────────┬─────────┘**

**↓**

**Marks Hidden**

**↓**

**Panel Logs Out**

**↓**

**┌──────────────────┐**

**│ PANEL AVAILABLE │**

**└────────┬─────────┘**

**↓**

**Next Interview**

**This should become the authoritative interview workflow in the production document. It creates a very clean separation: student exits → panel evaluates → marks disappear → panel exits → next interview.**

**18. INTERVIEW COMPLETION VALIDATION**

For an interview to be considered officially completed:

**Student status:**

Completed

AND

**Panel status:**

Completed

Then:

**Interview Status = COMPLETED**

This prevents a panel from claiming an interview occurred when the student has not acknowledged participation, and vice versa.

However, there should be a **Senate override mechanism** for exceptional circumstances such as:

-   student device failure

-   network failure

-   emergency

-   student leaving without marking completion

Every override must require a reason and be recorded in the audit log.

**19. EVALUATION INTERFACE**

After the interview is completed, the panel gets access to the evaluation screen.

For individual interview:

Student A\
Marks: \_\_\_ / 30

For group interview:

Group G12

  -----------------------------------------------------------------------
  **Student**                                **Marks**
  ------------------------------------------ ----------------------------
  Student A                                  \_\_\_

  Student B                                  \_\_\_

  Student C                                  \_\_\_

  Student D                                  \_\_\_
  -----------------------------------------------------------------------

The panel enters marks for each student.

**20. MARK VALIDATION**

The system must automatically enforce:

**0 ≤ Marks ≤ Maximum Marks**

For example:

Maximum = 30

The system accepts:

-   0

-   10

-   24

-   30

Rejects:

-   -1

-   31

-   40

Decimal marks should either be permitted or prohibited based on the Senate\'s policy. This should be defined globally.

**21. MARK SUBMISSION**

After entering marks, the evaluator clicks:

**SUBMIT MARKS**

The system displays:

**Warning:** Once submitted, marks cannot be changed by the evaluator or CCA.

Confirmation:

**CONFIRM & LOCK MARKS**

After confirmation:

**Marks Status = LOCKED**

Timestamp recorded.

Evaluator identity recorded.

**22. IMMUTABLE MARKS --- CRITICAL SYSTEM RULE**

This is one of the most important features of the portal.

Once marks are submitted:

**CCA cannot:**

-   Edit marks

-   Delete marks

-   Replace marks

-   Reopen marks

-   Change maximum marks

The database should treat the evaluation record as **immutable**.

**23. MARK HIDING**

Immediately after submission:

**CCA should no longer see the marks.**

The evaluator sees:

**Evaluation submitted successfully.**

But not:

27/30

The CCA interface should instead show:

**Evaluation Status: Submitted & Locked**

This prevents evaluators from using previously entered marks to influence subsequent evaluations.

**24. STUDENT BLINDNESS**

Students shall **never see their marks**.

Student dashboard can show:

Round 1 --- Completed ✓

Round 2 --- Completed ✓

Final Selection --- Selected / Not Selected

But never:

Marks = 72/100

unless the Senate explicitly changes the institutional policy in a future version.

**25. SENATE DASHBOARD**

The Senate dashboard is the **central monitoring interface**.

It should provide complete visibility across all 35 CCAs.

**Main dashboard**

Display:

  -----------------------------------------------------------------------
  **Metric**                                               **Value**
  -------------------------------------------------------- --------------
  Total CCAs                                               35

  CCAs configured                                          X

  CCAs active                                              X

  CCAs completed                                           X

  Students participating                                   X

  Rounds completed                                         X

  Rounds currently active                                  X

  Evaluations completed                                    X

  Pending evaluations                                      X

  Exceptions                                               X
  -----------------------------------------------------------------------

**26. CCA MONITORING**

Senate can click any CCA.

Example:

**Consulting Club**

**Status:** Round 2 Active

**Verticals:** 4

**Total Seats:** 12

**Rounds:** 4

  -------------------------------------------------------------------------
  **Round**    **Type**                    **Max Marks**    **Status**
  ------------ --------------------------- ---------------- ---------------
  Round 1      Individual Task             20               Completed

  Round 2      Group Task                  30               Completed

  Round 3      Individual Interview        20               Active

  Round 4      Final Interview             30               Pending
  -------------------------------------------------------------------------

**27. SENATE --- REAL-TIME ROUND MONITORING**

For each active round Senate can see:

-   Number of students assigned

-   Number completed

-   Number pending

-   Number of submissions

-   Number of interviews started

-   Number of interviews completed

-   Number of evaluations submitted

-   Number of evaluations pending

-   Panel allocation

-   Panel composition

-   Round timeline

Example:

**Round 3 --- Interview**

**Students:** 60

**Interviews completed:** 42

**Interviews pending:** 18

**Evaluations submitted:** 40

**Evaluations pending:** 20

**28. SENATE --- MARK VISIBILITY**

Senate shall have access to **all marks**.

Example:

  --------------------------------------------------------------------------------------
  **Student**    **CCA**           **Vertical**   **R1**   **R2**   **R3**   **Total**
  -------------- ----------------- -------------- -------- -------- -------- -----------
  S001           Consulting        Strategy       18       25       17       60

  S002           Consulting        Finance        16       27       19       62
  --------------------------------------------------------------------------------------

Senate should also be able to see:

-   Evaluator

-   Panel

-   Timestamp

-   Round

-   Maximum marks

-   Marks awarded

-   Evaluation status

**29. AUDIT TRAIL**

Every significant action must generate an immutable audit record.

**Audit record should contain:**

-   User ID

-   User role

-   Action

-   Entity

-   Old value, if applicable

-   New value, if applicable

-   Timestamp

-   IP/device information where institutionally appropriate

Example:

10 Sept 2026, 15:42\
Panel Member: P123\
Action: Submitted Evaluation\
Student: S456\
Round: R3\
Marks: 24/30

The audit log should be accessible to Senate.

**30. IMPORTANT EVENTS THAT MUST BE LOGGED**

At minimum:

-   CCA created

-   CCA configuration submitted

-   Vertical added

-   Seats changed

-   Round created

-   Round modified

-   Selection structure finalized

-   Selection process started

-   Panel created

-   Panel member added/removed

-   Student applied

-   Task submitted

-   Interview started

-   Interview completed

-   Evaluation started

-   Marks submitted

-   Marks locked

-   Senate override

-   Exception raised

-   Final selection declared

**31. NO SILENT CHANGES**

The system must never allow a material change without an audit trail.

For example, if seats change:

❌ Simply overwrite:

5 seats → 7 seats

Instead:

**Audit Log**

Original seats: 5\
New seats: 7\
Changed by: CCA Admin\
Time: 14:32\
Reason: \_\_\_\_\_\_

However, after the relevant process has been locked, the system should reject such changes altogether unless Senate performs an authorized override.

**32. SENATE ALERT SYSTEM**

The Senate dashboard should automatically flag exceptions.

Examples:

**🔴 Critical**

-   Marks modified attempt

-   Round structure modified after locking

-   Maximum marks modification attempt

-   Panel changed after evaluation began

-   Evaluation submitted without interview completion

-   Unauthorized access attempt

**🟠 Warning**

-   Evaluation pending beyond deadline

-   Student has not marked interview completion

-   Panel has not completed evaluation

-   CCA has not finalized round

**🟢 Normal**

-   Round completed

-   Evaluation submitted

-   Task submitted

**33. ROLE-BASED ACCESS CONTROL**

This is essential.

  ----------------------------------------------------------------------------------------
  **Feature**             **Senate**   **CCA**            **Student**
  ----------------------- ------------ ------------------ --------------------------------
  View all CCAs           ✓            ✗                  ✗

  Configure CCA           ✗            ✓                  ✗

  Configure verticals     View         ✓                  View

  Configure rounds        View         ✓                  View

  Configure marks         View         ✓\*                View max only if policy allows

  Configure panels        View         ✓                  ✗

  Apply                   ✗            ✗                  ✓

  Submit task             ✗            ✗                  ✓

  Mark interview status   View         ✓                  ✓

  Enter marks             View         ✓                  ✗

  View marks              ✓            ✗                  ✗

  Change marks            ✗            ✗                  ✗

  Audit log               ✓            Limited            Own activity

  Declare selection       Oversight    Proposed/execute   ✗
  ----------------------------------------------------------------------------------------

\* Only before selection locking.

**34. CCA DASHBOARD --- PROPOSED STRUCTURE**

**Home**

**CCA Selection Dashboard**

-   Selection status

-   Current round

-   Number of applicants

-   Number participating

-   Number completed

-   Pending actions

**Menu**

1.  **CCA Profile**

2.  **Verticals & Seats**

3.  **Selection Structure**

4.  **Rounds**

5.  **Panels**

6.  **Students**

7.  **Tasks**

8.  **Interviews**

9.  **Evaluations**

10. **Selection Status**

11. **Audit / Activity**

**35. STUDENT DASHBOARD --- PROPOSED STRUCTURE**

**Home**

**My CCA Applications**

  ------------------------------------------------------------------------
  **CCA**            **Vertical**                **Status**
  ------------------ --------------------------- -------------------------
  CCA 1              Vertical A                  Round 2

  CCA 2              Vertical C                  Selected
  ------------------------------------------------------------------------

**Application page**

-   CCA information

-   Applied vertical

-   Selection structure

-   Current round

-   Task

-   Interview

-   Deadlines

-   Participation status

**Marks are never displayed.**

**36. SENATE DASHBOARD --- PROPOSED STRUCTURE**

**Top-level dashboard**

**CCA Selection --- Senate Control Centre**

**Overall**

35 CCAs

↓

**Configured:** 35

**Active:** 29

**Completed:** 4

**Yet to Start:** 2

**CCA table**

  ------------------------------------------------------------------------------------------------
  **CCA**   **Applicants**   **Current Round**   **Progress**   **Evaluations**   **Exceptions**
  --------- ---------------- ------------------- -------------- ----------------- ----------------
  CCA 1     85               R3                  72%            68/85             0

  CCA 2     63               R2                  51%            30/63             2

  CCA 3     91               R4                  89%            85/91             0
  ------------------------------------------------------------------------------------------------

Clicking the CCA opens its detailed monitoring page.

**37. SELECTION LIFECYCLE**

The complete workflow should be:

CCA Registration

↓

Vertical & Seat Configuration

↓

Round Configuration

↓

Maximum Marks Configuration

↓

Panel Configuration

↓

CCA Finalizes Selection Structure

↓

Senate Verification / Monitoring

↓

Applications Open

↓

Students Apply

↓

Selection Begins

↓

Round 1

↓

Task / Interview

↓

Student Marks Participation

↓

CCA Marks Participation

↓

CCA Evaluates

↓

Marks Submitted

↓

MARKS LOCKED

↓

Marks Hidden from CCA

↓

Next Round

↓

Final Evaluation

↓

Final Selection

↓

Senate Monitoring / Ratification

**38. ROUND STATE MACHINE**

Each round should have a defined status.

DRAFT

↓

CONFIGURED

↓

LOCKED

↓

SCHEDULED

↓

ACTIVE

↓

EVALUATION

↓

COMPLETED

No arbitrary movement between states should be permitted.

For example:

**COMPLETED → ACTIVE**

should not be possible for a CCA.

If an exception is required, Senate authorization must be required.

**39. EVALUATION STATE MACHINE**

For each student:

NOT STARTED

↓

PARTICIPATION STARTED

↓

PARTICIPATION COMPLETED

↓

EVALUATION PENDING

↓

EVALUATION SUBMITTED

↓

MARKS LOCKED

After:

**MARKS LOCKED**

there is no normal reverse transition.

**40. GROUP ROUND MANAGEMENT**

Group rounds require a separate group entity.

Example:

**Round 2**

**Group G05**

Students:

-   S001

-   S002

-   S003

-   S004

-   S005

System assigns:

Panel P2

If the task is group-based, the task submission may be one submission for the group.

If evaluation is individual:

  -----------------------------------------------------------------------
  **Student**                             **Marks**
  --------------------------------------- -------------------------------
  S001                                    24

  S002                                    21

  S003                                    27

  S004                                    19

  S005                                    25
  -----------------------------------------------------------------------

The system must preserve the relationship:

**Student → Group → Round → Panel → Evaluation**

**41. INDIVIDUAL VS GROUP INTERVIEW**

**Individual**

One student:

Student A

One evaluation:

Student A = 24/30

**Group**

One group:

G05

Multiple evaluations:

A = 24\
B = 22\
C = 26\
D = 21

The system must ensure no student is accidentally omitted from group evaluation.

Before submission, display:

**4/4 students evaluated**

Only then can the panel submit the evaluation.

**42. EVALUATION COMPLETENESS CHECK**

Before a panel can submit:

System checks:

-   Has interview been completed?

-   Is every assigned student evaluated?

-   Are all marks within permitted range?

-   Is panel authorized for this round?

-   Is evaluator logged in?

-   Has evaluation already been submitted?

If any condition fails:

**Evaluation cannot be locked.**

**43. FINAL SELECTION**

After all rounds are completed, the system calculates:

**Total Marks = Σ marks obtained across rounds**

Example:

  ----------------------------------------------------------------------------------
  **Student**   **R1 /20**   **R2 /30**   **R3 /20**   **R4 /30**   **Total /100**
  ------------- ------------ ------------ ------------ ------------ ----------------
  S1            18           25           17           28           88

  S2            17           28           15           25           85
  ----------------------------------------------------------------------------------

The calculation should be system-generated, not manually entered.

**44. SELECTION BY VERTICAL**

The system should generate ranking **within each CCA/vertical**, subject to the selection rules defined by the institution.

Example:

**Strategy Vertical --- 4 seats**

  ------------------------------------------------------------------------
  **Rank**             **Student**                    **Total**
  -------------------- ------------------------------ --------------------
  1                    S12                            91

  2                    S27                            89

  3                    S08                            87

  4                    S44                            86

  5                    S31                            85
  ------------------------------------------------------------------------

Top 4:

**Selected**

Student 31:

**Waitlisted / Not Selected**, depending on institutional rules.

**45. TIE-BREAKING**

The production document should include a predefined tie-breaking mechanism.

For example:

1.  Higher final-round score

2.  Higher interview score

3.  Higher task score

4.  Senate-defined tie-breaker

**Important:** The tie-breaking rule must be configured **before the selection begins**.

CCA should not be able to invent a tie-breaker after seeing the results.

**46. SENATE OVERSIGHT WITHOUT EVALUATION INTERFERENCE**

The Senate should have **visibility but not ordinary editing rights** over CCA marks.

This creates separation:

**CCA = Evaluator**

**Senate = Auditor/Monitor**

Senate should not ordinarily change a student\'s marks.

If an exceptional correction is legally/institutionally required, it should follow:

Exception Raised

↓

Reason Recorded

↓

Evidence Attached

↓

Senate Authorization

↓

Correction/Override

↓

Permanent Audit Record

Even then, the original mark should never be deleted.

**47. MARK VERSIONING**

Even in exceptional circumstances, never overwrite the original evaluation.

Example:

**Original**

24/30\
Evaluator: X\
Time: 15:31

**Override**

26/30\
Authorized by Senate\
Reason: documented technical/evaluation error\
Time: 18:45

Database retains both.

This is much safer than simply changing 24 → 26.

**48. SECURITY REQUIREMENTS**

The development team should implement:

**Authentication**

Prefer institutional SSO/login.

**Authorization**

Role-based access control.

**Session security**

-   Secure session management

-   Automatic logout

-   Protection against session hijacking

**Data security**

-   Encryption in transit

-   Encryption at rest

-   Regular database backup

**Audit**

Immutable audit logs.

**49. ANTI-MANIPULATION REQUIREMENTS**

The following must be technically prevented:

**❌ CCA changing marks after submission**

**❌ CCA seeing marks after submission**

**❌ Student seeing marks**

**❌ CCA changing maximum marks after round begins**

**❌ CCA changing round structure after selection starts**

**❌ Evaluator evaluating students outside their assigned panel**

**❌ Evaluator evaluating the same student twice**

**❌ Deleting evaluation records**

**❌ Backdating submissions**

**❌ Deleting audit records**

**❌ Changing timestamps**

**❌ Changing panel composition after evaluation without authorization**

**50. TIME-STAMPING**

Every significant action should use **server-side timestamps**, not the user\'s device clock.

For example:

Task submitted --- 14:32:17 IST

not a timestamp supplied by the student\'s laptop.

This is important for disputes regarding deadlines.

**51. NOTIFICATION SYSTEM**

The system should generate notifications for:

**Students**

-   Application submitted

-   Round opened

-   Task assigned

-   Submission deadline approaching

-   Interview scheduled

-   Interview status

-   Selection result

**CCA**

-   Application window opened

-   Round starting

-   Interview scheduled

-   Evaluation pending

-   Evaluation deadline

-   Round completion

**Senate**

-   CCA configuration submitted

-   Selection started

-   Round completed

-   Exceptions

-   Pending evaluations

-   Attempted unauthorized modifications

**52. SENATE EXCEPTION CENTRE**

A dedicated page should exist:

**Exceptions & Alerts**

Example:

  -----------------------------------------------------------------------------------
  **Time**   **CCA**   **Issue**                       **Severity**   **Status**
  ---------- --------- ------------------------------- -------------- ---------------
  14:32      CCA 7     Evaluation overdue              🟠             Open

  15:04      CCA 12    Panel modification attempt      🔴             Investigating

  15:20      CCA 18    Student interview mismatch      🟠             Resolved
  -----------------------------------------------------------------------------------

This allows Senate to focus on anomalies instead of manually checking 35 CCAs.

**53. DASHBOARD COLOUR/STATUS SYSTEM**

Recommended standard:

🟢 **Normal / Completed**

🔵 **Active**

🟡 **Pending**

🟠 **Attention Required**

🔴 **Exception / Critical**

The actual colours can be decided by the UI team.

**54. IMPORTANT DESIGN PRINCIPLE --- \"CONFIGURE ONCE, EXECUTE LATER\"**

The CCA should **not design the process while the process is running.**

The intended model is:

**Before selection**

CCA defines:

-   Verticals

-   Seats

-   Number of rounds

-   Round type

-   Maximum marks

-   Panels

-   Panel members

-   Evaluation structure

-   Timeline

**After selection starts**

CCA can only:

**Execute the pre-declared process.**

This is fundamental to fairness.

**55. IMPORTANT DESIGN PRINCIPLE --- \"MARKS ARE A ONE-WAY DOOR\"**

The mark workflow should be:

**Enter → Review → Confirm → Lock → Hide**

After that:

**No normal edit.**

This should be enforced at the **database/API level**, not merely by hiding an \"Edit\" button on the website.

Otherwise, someone could potentially manipulate the system through another interface/API.

**56. DATABASE-LEVEL INTEGRITY**

The development team should specifically ensure:

**Evaluation table**

Possible fields:

evaluation_id

round_id

panel_id

student_id

evaluator_id

maximum_marks

marks_awarded

status

submitted_at

locked_at

created_at

Once:

status = LOCKED

the application should reject ordinary UPDATE/DELETE operations.

**57. CORE DATABASE RELATIONSHIP**

A simplified architecture:

┌──────────────┐

│ SENATE │

└──────┬───────┘

│

MONITOR/AUDIT

│

┌─────────────┴─────────────┐

│ │

┌─────▼─────┐ ┌────▼─────┐

│ CCA │ │ STUDENT │

└─────┬─────┘ └────┬─────┘

│ │

┌─────▼──────┐ APPLICATION

│ VERTICAL │ │

└─────┬──────┘ │

│ │

SEATS │

│ │

┌─────▼──────┐ │

│ ROUNDS │◄───────────────────┘

└─────┬──────┘

│

PANELS

│

┌─────▼──────┐

│EVALUATION │

└─────┬──────┘

│

MARKS

│

┌─────▼──────┐

│ AUDIT LOG │

└────────────┘

**58. END-TO-END EXAMPLE**

Consider **CCA X**.

It declares:

-   3 verticals

-   12 total seats

-   4 rounds

**Configuration**

**Round 1**

Individual Task --- 20 marks

**Round 2**

Group Task --- 20 marks

**Round 3**

Individual Task + Interview --- 30 marks

**Round 4**

Individual Interview --- 30 marks

Total = **100**

CCA finalizes the structure.

**Student applies**

Student A:

CCA X → Strategy Vertical

System records application.

**Round 1**

Student receives task.

Student submits at:

10:31:42

CCA evaluates:

17/20

CCA clicks:

Submit & Lock

System:

Marks Locked

CCA can no longer see **17**.

Senate can see:

Student A --- Round 1 --- 17/20 --- Locked

Student sees:

Round 1 --- Completed

**Round 3**

Student A enters interview.

Student clicks:

Interview Started

Panel clicks:

Interview Started

Interview finishes.

Student:

Interview Completed

Panel:

Interview Completed

System now enables evaluation.

Panel enters:

25/30

Panel submits.

Marks become:

**LOCKED**

CCA cannot see the 25.

Senate can see 25.

Student cannot see 25.

**59. SENATE\'S KEY VIEW**

For Student A, Senate should ultimately see something like:

  ----------------------------------------------------------------------------------------------
  **Round**   **Type**            **Max**   **Marks**   **Panel**   **Evaluator**   **Status**
  ----------- ------------------- --------- ----------- ----------- --------------- ------------
  R1          Individual Task     20        17          P1          X               Locked

  R2          Group Task          20        16          P2          Y               Locked

  R3          Task + Interview    30        25          P1          Z               Locked

  R4          Interview           30        27          P3          W               Locked

  **Total**                       **100**   **85**                                  
  ----------------------------------------------------------------------------------------------

Student sees only:

**Application Status: Selection Completed**

**60. MVP DEVELOPMENT PRIORITY**

I would recommend the development team build in this order.

**Phase 1 --- Authentication & Roles**

-   Student login

-   CCA login

-   Senate login

-   Role permissions

**Phase 2 --- CCA Configuration**

-   CCA

-   Verticals

-   Seats

-   Rounds

-   Maximum marks

-   Panels

**Phase 3 --- Student Applications**

-   CCA selection

-   Vertical selection

-   Application tracking

**Phase 4 --- Round Execution**

-   Task

-   Submission

-   Groups

-   Interview scheduling

-   Interview start/end status

**Phase 5 --- Evaluation**

-   Panel evaluation

-   Marks submission

-   Locking

-   Mark hiding

**Phase 6 --- Senate Dashboard**

-   Real-time monitoring

-   Marks

-   Progress

-   Exceptions

-   Audit trail

**Phase 7 --- Final Selection**

-   Total calculation

-   Ranking

-   Vertical-wise selection

-   Waitlist

-   Result declaration

**61. NON-NEGOTIABLE BUSINESS RULES**

The development team should put these in the specification as **hard requirements**.

**BR-01:** Students shall never have access to their marks.

**BR-02:** CCA evaluators shall not have access to marks after submission and locking.

**BR-03:** Senate shall have complete access to marks and process information.

**BR-04:** Marks shall become immutable immediately upon submission.

**BR-05:** Maximum marks shall be defined before the round begins.

**BR-06:** Round structure shall be finalized before selection begins.

**BR-07:** Panel composition shall be defined before evaluation begins.

**BR-08:** An evaluator may evaluate only students assigned to their panel.

**BR-09:** Every evaluation shall have a server-generated timestamp.

**BR-10:** Every significant system action shall create an audit record.

**BR-11:** Audit records shall not be deletable by CCA users.

**BR-12:** System-generated totals shall not be manually editable.

**BR-13:** Any Senate override shall require a reason and create an immutable audit record.

**BR-14:** Original marks shall never be destroyed even if an authorized correction occurs.

**BR-15:** The system shall prevent retroactive modification of selection rules after the selection process has begun.

**62. THE CENTRAL GOVERNANCE LOGIC**

The entire website can ultimately be summarized by this architecture:

**CCA decides the process → System locks the process → Students participate → CCA evaluates → System locks the marks → CCA loses visibility → Senate monitors everything → System maintains an immutable audit trail.**

That separation is what makes the portal a **fair-selection system rather than simply an online application form.**

**One additional recommendation**

For a Senate whose purpose is specifically **\"Righteous and Unbiased\" selection**, I would make **three things technically impossible rather than merely policy-prohibited**:

**1. Changing locked marks**\
**2. Changing the declared selection structure after selection starts**\
**3. Showing marks to anyone except authorized Senate users**

Those three controls should exist at the **backend/database permission level**, not just at the webpage/UI level. This is the strongest way to make the portal genuinely auditable and resistant to manipulation.

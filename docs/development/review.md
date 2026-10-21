# Independent architecture and change review

Start each independent architect, planning auditor and reviewer in a fresh session with no inherited
conversation. For Codex collaboration, use `fork_turns="none"`. Use the session's selected model unless
the user chooses another. A role label on the author's existing session is not independent review.

Give one narrow question, absolute checkout/guide paths, goals, constraints and acceptance criteria.
Identify relevant paths and exact revisions: baseline plus a proposed artifact for architecture, or
base/head plus a prepared diff for final review. A commit range alone suffices only with Git access.
Include available verification, its revision/scope and limitations as evidence to inspect.

Keep the brief neutral: no author conversation, persuasive reasoning, preferred answer, earlier review
conclusions or desired verdict. A proposal may be the explicit review subject. The agent reads the
relevant guides and independently inspects source, tests and contracts to develop its own perspective.

Architects review the named API, ownership, lifecycle or cost question without implementing it.
Diff reviewers check affected contracts and evidence without fixing files. Both stay read-only and
report actionable findings with severity, locations and uncertainty. Preserve actual harness permissions;
role text does not impose a sandbox. Use a separate final reviewer from the author or design advisor.
A reviewer may recheck fixes for unchanged scope; a new topic gets a fresh invocation.

Review only the changed surface. A prose-only change needs consistency/link checks; runtime/API changes
need relevant regression and repository verification. Do not invent undocumented compatibility duties
or weaken existing public contracts. The delivery owner integrates corrections and verifies merge gates.

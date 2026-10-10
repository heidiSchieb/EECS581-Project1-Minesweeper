# EECS 581 Team Portfolio

**Course:** EECS 581 - Software Engineering II  
**Semester:** Fall 2026  
**Instructor:** Professor Hossein Saiedian

## Team
| Member | KU email | GitHub | Expertise | Availability |
| --- | --- | --- | --- | --- |
| <img src="assets/anhhoang.jpg" alt="Anh Hoang" width="60"><br>Anh Hoang | [anh.hoang@ku.edu](mailto:anh.hoang@ku.edu) | [byAnh-Dev](https://github.com/byAnh-dev) | React, Flask, Node.js | MWF, 12–1 PM |
| <img src="assets/sreeja.jpeg" alt="Anh Hoang" width="60"><br>Sreeja Narahari | [sreeja@ku.edu](mailto:sreeja@ku.edu) | [sreeja-na](https://github.com/sreeja-na) | UI, Backend | TuThu, 10-11 AM |
| <img src="assets/Shayaan.JPG" alt="Shayaan Mohammed" width="60"><br>Shayaan Mohammed | [shayaanm@ku.edu](mailto:shayaanm@ku.edu) | [Shayaan04](https://github.com/Shayaan04) | Backend | MWF 12-1PM |
| <img src="assets/Kodai.PNG" alt="Kodai Nakae" width="60"><br>Kodai Nakae | [kodai.nakae@ku.edu](mailto:kodai.nakae@ku.edu) | [kodai1126](https://github.com/kodai1126) | DSA | MWF 12-1PM |
| <img src="assets/Mariska.png" alt="Mariska Rai" width="60"><br>Mariska Rai | [mrai38@ku.edu](mailto:mrai38@ku.edu) | [mariskarai](https://github.com/mariskarai) | UI/UX, backend | Wed, 1–2 PM |
| <img src="assets/rijul.png" alt="Rijul Poudel" width="60"><br>Rijul Poudel | [rijulpoudel72@ku.edu](mailto:rijulpoudel72@ku.edu) | [rijulpoudel](https://github.com/rijulpoudel) | Backend | Wed–Fri, 5–8 PM |
| <img src="assets/Montaha.jpeg" alt="Montaha Jornaz" width="60"><br>Montaha Jornaz | [m890j038@ku.edu](mailto:m890j038@ku.edu) | [montahajornaz](https://github.com/montahajornaz) | Backend | MWF, 1–2 PM |
## Team Roles

| Role                 | Team member   | Responsibilities                                           |
| -------------------- | ------------- | ---------------------------------------------------------- |
| Team administrator   | Montaha       | Submit project links and deliverables to Canvas            |
| Project coordinator  | Mariska       | Track milestones, tasks, and deadlines                     |
| Repository manager   | Anh, Rijul    | Maintain the repository structure and review pull requests |
| Meeting-log owner    | Shayaan       | Record attendance, decisions, tasks, and task completion   |
| Testing/quality lead | Kodai, Sreeja | Coordinate testing and verify deliverables                 |

## Meetings

- **Internal team meeting:** Wed 8:00PM-9:00PM
- **Weekly TA meeting:** Wed 1:00pm - 2:00pm, Eaton 3001
- [View all meeting logs](./meeting-logs/)

## Minesweeper setup info

### How to run our repo

```sh
git clone https://github.com/byAnh-dev/EECS581-Project1-Minesweeper.git
cd EECS581-Project1-Minesweeper
npm ci
npm run dev
```

Open the URL printed in the terminal. Press Ctrl+C to stop.

- `npm run typecheck` — check types.
- `npm run build` — check types and build to `dist/`.
- `npm run preview` — preview the build locally.

## Play

Choose 10–20 mines and select **Start round**. Left-click to reveal; right-click or press F on a focused cell to toggle a flag. Reveal all safe cells to win. The first reveal always opens a clear area around the selected cell; any flags in that guaranteed-safe area are removed.

Flags are capped at the chosen mine count. **Mines left** shows flags remaining. Unflag a cell before revealing it. **New Game** returns to setup; refreshing resets the game.

## Source

| File | Purpose |
| --- | --- |
| [UserInterface.tsx](./src/UserInterface.tsx) | React state and screen layout |
| [components/](./src/components/) | Board and setup controls |
| [inputHandler.ts](./src/inputHandler.ts) | Input validation and command dispatch |
| [gameLogic.ts](./src/gameLogic.ts) | Start, reveal, flags, flood fill, and win/loss rules |
| [boardManager.ts](./src/boardManager.ts) | Board operations, mines, and neighbor counts |
| [types.ts](./src/types.ts) | Shared types and constants |
| [main.tsx](./src/main.tsx) / [styles.css](./src/styles.css) | Entry point and styling |

[System architecture](./docs/architecture.pdf) · [Hour estimate and methods](#hour-estimate-using-use-case-points) · [Personal hour tracking](#4-actual-hours-by-team-member)

## Hour estimate using Use Case Points
**Provisional result: 31.95 Use Case Points × 2 hours = about 64 person-hours.**

### 1. Count actors and use cases

The only actor is the **player**. A person using a graphical interface has actor weight **3**.Use cases come from the four user stories:

| Use case | Counted steps | Size | Weight |
| --- | ---: | --- | ---: |
| Choose mine count and start | 4 | Average | 10 |
| Reveal a cell | 7 | Average | 10 |
| Flag or unflag a cell | 5 | Average | 10 |
| Return to setup | 2 | Simple | 5 |
| **Use-case total** | | | **35** |

Based on lecture: **1–3 steps = 5 points; 4–7 = 10; 8+ = 15.**
Further explanation for the step count above:

| Use case | Main flow | Additional steps in alternatives |
| --- | --- | --- |
| Start | Submit count → system validates and creates the round → display covered board (3) | Display invalid-count feedback (1) |
| Reveal | Select cell → system checks eligibility and opens the safe cell/area → display board (3) | Relocate a first-click mine (1); ignore an ineligible reveal (1); expose mines and end in loss (1); display victory after the last safe cell (1) |
| Flag | Select cell → system checks and places flag → display cell/counter (3) | Remove an existing flag (1); ignore a blocked action (1) |
| Return to setup | Select New Game/Start round → clear the round and display setup (2) | None; starting the next round reuses Start |

**Unadjusted points = 35 use-case weight + 3 actor weight = 38.**


### 2. Adjust for the project and team


| Adjustment | Weighted rating total | Formula | Result |
| --- | ---: | --- | ---: |
| Technical complexity | 24.5 | 0.6 + 0.01 × 24.5 | 0.845 |
| Team/environment | 13.5 | 1.4 − 0.03 × 13.5 | 0.995 |

**Adjusted UCP = 38 × 0.845 × 0.995 = 31.94945.**

**Technical factors**
| Factor | Weight | Rating | Reason for proposed rating |
| --- | ---: | ---: | --- |
| Distributed system | 2 | 0 | One browser; no backend |
| Performance targets | 2 | 1 | Small board; ordinary UI response |
| Player efficiency | 1 | 3 | Fast reveal/flag controls |
| Internal processing | 1 | 3 | Mine placement, relocation, flood fill |
| Reusable code | 1 | 3 | Shared modules and helpers |
| Easy installation | 0.5 | 4 | Runs in a browser |
| Ease of use | 0.5 | 5 | Intuitive UI required by rubric |
| Portability | 2 | 3 | Browser-based implementation |
| Ease of change | 1 | 3 | Project 2 handoff and modularity |
| Concurrency | 1 | 0 | Single-player, synchronous rules |
| Security features | 1 | 0 | No accounts or sensitive stored data |
| Third-party access | 1 | 0 | No external API requirement |
| Special user training | 1 | 0 | No training subsystem |

**Environmental factors**
| Factor | Weight | Provisional rating |
| --- | ---: | ---: |
| Process familiarity | 1.5 | 3 |
| Application experience | 0.5 | 3 |
| Object-oriented experience | 1 | 3 |
| Lead analyst capability | 0.5 | 3 |
| Motivation | 1 | 3 |
| Requirements stability | 2 | 3 |
| Part-time work | -1 | 3 |
| Language difficulty | -1 | 3 |
</details>

### 3. Convert points to person-hours

Since all the user case point are fairly easy to achieve, we are counting 1 user case point = 2 person-hour.

**31.94945 × 2 ≈ 64 person-hours.**

### 4. Actual hours by team member
| Team member | Work used for tracking| Actual hours |
| --- | --- | ---: | 
| Anh Hoang | Project setup, shared types, board initialization, documentation, module consolidation | 10 | 
| Sreeja Narahari | Setup controls/styling, level/loading panels, meeting-log upload | 8 | 
| Shayaan Mohammed | Input parsing, validation, reveal/flag dispatch, profile updates | 7 |
| Kodai Nakae | Testing; README roles, meeting details, profile updates | 7 | 
| Mariska Rai | Game board/UI integration, styling, loading-screen fix, profile updates | 10 | 
| Rijul Poudel | Reveal guards, relocation, safe-area expansion, win/loss integration, documentation | 9 | 
| Montaha Jornaz | Adjacent-mine counts, first-click safety, flag rules/counter, README updates | 7 |
| **Team total** | | **58** | |

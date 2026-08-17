# Agent Control Center

Een lokale operations-console voor het beheren en observeren van AI-agents die softwareontwikkelingstaken uitvoeren.

Dit is geen spel en geen simulatie. Er zit geen XP, geen levels, geen willekeurige events en geen achtergrondtimer die zelf activiteit verzint in. De enige terugkerende timer verzet de klok, zodat relatieve tijdstempels (`4m ago`) blijven kloppen. De data komt uit lokale fixtures; de interface is gebouwd alsof er een echte control plane achter zit.

De code, de UI-teksten en de commentaren zijn Engelstalig — dat is de taal waarin dit soort tooling doorgaans wordt gelezen en waarin de domeinbegrippen (`pull request`, `pipeline`, `approval`) eenduidig zijn. Deze documentatie is Nederlands.

---

## 1. Installatie

Vereist Node.js 22 of nieuwer (ontwikkeld en getest op Node 22; CI draait op 22 en 24). Node 20 is end-of-life en wordt niet meer ondersteund.

```bash
npm install
```

## 2. Lokaal draaien

```bash
npm run dev        # dev-server op http://127.0.0.1:5173
npm run build      # typecheck + productiebuild naar dist/
npm run preview    # serveert de productiebuild op http://127.0.0.1:4173
npm run typecheck  # alleen de TypeScript-projectbuild
npm run lint       # ESLint
```

De applicatie gebruikt hash-routing, dus deep links werken zonder serverconfiguratie:

| Scherm | URL |
| --- | --- |
| Overview | `#/overview` |
| Agents | `#/agents` — of direct een agent: `#/agents/agt-java-01` |
| Tasks | `#/tasks` |
| Approvals | `#/approvals` |
| Activity | `#/activity` |
| Repositories | `#/repositories` |
| System Health | `#/health` |
| Settings | `#/settings` |

---

## 3. Projectstructuur

```
agent-control-center/
├── index.html                     Theme wordt vóór de eerste paint gezet (geen flits)
├── package.json
├── vite.config.ts                 Vite + React, alias @ -> src
├── tailwind.config.js             darkMode: 'class', control-room palet
├── postcss.config.js
├── tsconfig.json / .app.json / .node.json    Strikte TS-projectreferenties
├── .eslintrc.cjs
└── src/
    ├── main.tsx                   Entry point
    ├── App.tsx                    Shell: providers + routing + layout
    ├── index.css                  Tailwind-lagen en herbruikbare klassen (.panel, .data-table)
    │
    ├── types/                     Het domeinmodel — de kern van dit project
    │   ├── common.ts              Branded ids, Severity, RiskLevel, Priority, Page<T>
    │   ├── agent.ts               Agent, AgentStatus, AgentCapability, AgentLog,
    │   │                          ToolExecution, ChangedFile, AgentArtifact, AgentError,
    │   │                          Blocker, ExecutionHistoryEntry, AgentDetail, AgentCommand
    │   ├── task.ts                Task, TaskStatus, TaskApprovalStatus, Subtask
    │   ├── activity.ts            ActivityEvent, ActivityEventType, ActivityFilter, TimeWindow
    │   ├── approval.ts            ApprovalRequest, ApprovalActionType, ProposedChange, ...
    │   ├── repository.ts          Repository, PullRequest, PipelineRun, Commit, TestSummary
    │   ├── metrics.ts             CostUsage, FleetSummary, MetricSeries
    │   ├── health.ts              SystemHealth, HealthCheck, RateLimit, StreamStatus, JobQueue
    │   └── index.ts               Barrel-export
    │
    ├── lib/
    │   ├── policy.ts              Het veiligheidsmodel: 10 policy rules, single source of truth
    │   ├── statusMeta.ts          Label + kleurtoon + omschrijving per enum-waarde
    │   ├── format.ts              Tijd-, getal-, bedrag- en duurformattering
    │   └── cn.ts                  Class-name joiner
    │
    ├── data/                      Mockdata (TypeScript, volledig getypeerd)
    │   ├── time.ts                Tijdstempels relatief aan het laadmoment
    │   ├── ids.ts                 Alle ids centraal, zodat verwijzingen compile-time kloppen
    │   ├── agentProfiles.ts       Tool-catalogus + capability-builder die de policy toepast
    │   ├── agents.ts              10 agents + volledige AgentDetail per agent
    │   ├── tasks.ts               15 taken over alle 7 statussen
    │   ├── activity.ts            53 events over alle eventtypes
    │   ├── approvals.ts           10 approval requests (6 open, 4 afgehandeld)
    │   ├── repositories.ts        5 repositories, 7 pull requests, 6 pipeline runs
    │   └── health.ts              Systeemgezondheid + trendreeksen
    │
    ├── services/                  De vervangbare laag
    │   ├── types.ts               AgentService, TaskService, ActivityService,
    │   │                          ApprovalService, RepositoryService, MetricsService,
    │   │                          RealtimeService, ServiceRegistry
    │   ├── index.ts               Wiring: hier wisselt mock voor een echte backend
    │   └── mock/
    │       ├── store.ts           In-memory state + subscribe/emit
    │       └── index.ts           Mock-implementatie van alle services
    │
    ├── state/
    │   ├── ControlCenterContext.tsx   useSyncExternalStore + commando's + toasts
    │   └── ThemeContext.tsx           Dark/light, opgeslagen per browser
    │
    ├── navigation/
    │   ├── routes.ts              Views, hash parsing/serialisatie
    │   └── useRoute.ts            Hash-router hook
    │
    ├── hooks/
    │   └── useNow.ts              De enige terugkerende timer in de applicatie
    │
    ├── pages/                     Eén bestand per scherm uit de zijbalk
    │   ├── OverviewPage.tsx
    │   ├── AgentsPage.tsx
    │   ├── TasksPage.tsx
    │   ├── ApprovalsPage.tsx
    │   ├── ActivityPage.tsx
    │   ├── RepositoriesPage.tsx
    │   ├── SystemHealthPage.tsx
    │   └── SettingsPage.tsx
    │
    └── components/
        ├── layout/                Sidebar, TopBar
        ├── ui/                    Panel, StatusBadge, Controls, Drawer, CodeBlock,
        │                          Sparkline, Toasts, Icon (inline SVG, geen icon-library)
        ├── overview/              SummaryStrip, MetricTile
        ├── agents/                AgentTable, AgentCard, AgentDetailDrawer
        ├── tasks/                 TaskBoard, TaskTable, TaskDetailDrawer
        ├── activity/              ActivityTimeline
        ├── approvals/             ApprovalList, ApprovalDetail
        └── repositories/          RepositoryPanel
```

Runtime-dependencies: `react` en `react-dom`. Verder niets — geen router, geen state-library, geen icon-pakket, geen chart-library. Dat houdt de bundel klein (ca. 103 kB gzipped) en voorkomt dat een externe library de visuele taal bepaalt.

---

## 4. Architectuur in het kort

### Vier lagen, één richting

```
components/pages  →  state/ControlCenterContext  →  services/*  →  data/* (of straks: HTTP/WS)
       ↑                                                │
       └──────────── useSyncExternalStore ──────────────┘
```

**Geen enkel component importeert fixture-data.** Alles loopt via de service-interfaces in `src/services/types.ts`. Dat is de belangrijkste architectuurkeuze in dit project: het is de reden dat de mockdata vervangbaar is zonder de UI aan te raken.

### Types eerst

Het domeinmodel in `src/types/` is de contractlaag. Een paar keuzes die er echt toe doen:

- **Branded ids.** `AgentId`, `TaskId`, `RepositoryId` enzovoort zijn nominale types. Een `TaskId` doorgeven waar een `AgentId` wordt verwacht is een compile-fout, niet een bug die je op productie ontdekt.
- **ISO-strings, geen `Date`.** Elk tijdstempel is een `IsoTimestamp` (string). Daardoor kan elk object ongewijzigd over REST, WebSocket of SSE, en gebeurt parsing alleen aan de rand, in `lib/format.ts`.
- **`readonly` overal.** Alle domeinobjecten zijn diep readonly. Mutaties gaan uitsluitend via de services, die nieuwe objecten teruggeven.
- **`AgentDetail` staat los van `Agent`.** De tabel laadt alleen wat hij toont; logs, tool-calls en artifacts komen apart via `AgentService.getDetail`. Dat is nu goedkoop en straks noodzakelijk.
- **Strikte compileropties**: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`, `noFallthroughCasesInSwitch`.

### Het veiligheidsmodel zit in code, niet in een tekstje

`src/lib/policy.ts` bevat tien regels (POL-001 t/m POL-010) en is de enige plek waar staat wat een agent níét zelfstandig mag. Die tabel wordt op drie plekken gelezen:

1. **`data/agentProfiles.ts`** — de `capability()` builder bepaalt *niet zelf* of een capability autonoom is. Als een policy rule de capability dekt, wint de gate. Een agentprofiel kan zichzelf dus geen rechten geven die het beleid verbiedt.
2. **`services/mock/index.ts`** — `policyRefusal()` weigert operator-commando's die een gate zouden omzeilen. `Resume` op een agent met status `approval_required` wordt geweigerd met een uitleg, niet stil genegeerd.
3. **De UI** — het Approval Center, het capability-overzicht in het agentdetail en de Settings-pagina renderen dezelfde regels.

Zes van de tien regels zijn `overridable: false`: geen enkele configuratie kan ze autonoom maken. Dat zijn merge naar een beschermde branch, productie-deploy, secrets lezen, infrastructuur wijzigen, extern communiceren en financiële acties.

### State en realtime

`ControlCenterProvider` leest de store met `useSyncExternalStore`. De mock-store roept subscribers aan bij elke mutatie; een echte WebSocket-client zou exact dezelfde `RealtimeService.subscribe` implementeren. Er is geen tweede kopie van de data in componentstate, dus een push-update kan nooit tot een verouderd scherm leiden.

### Presentatie

- **Statuskleur is een token, geen ad-hoc keuze.** `lib/statusMeta.ts` mapt elke enumwaarde naar een `Tone`, en `TONE_CLASSES` mapt die op Tailwind-klassen. Een status krijgt nergens een losse kleur.
- **Kleur is nooit de enige drager.** Elke status toont een gekleurde punt *en* het geschreven label. Emoji's worden niet als interface-element gebruikt.
- **Dark en light zijn beide volwaardig.** De initiële waarde volgt het besturingssysteem en wordt vóór de eerste paint gezet.
- **Eén animatie:** de pulserende punt bij een werkelijk live status, uitgeschakeld bij `prefers-reduced-motion`.

---

## 5. Wat werkt, en wat nog mock is

### Volledig functioneel in deze versie

- Alle acht schermen, met filters, sorteringen, master-detail en deep links.
- Operator-commando's (pause, resume, stop, retry, reassign, review output) muteren state, schrijven een logregel en zetten een event op de tijdlijn.
- Approval-beslissingen (approve / reject / request changes) muteren de aanvraag, deblokkeren of stoppen de aanvragende agent, werken de bijbehorende taak bij en loggen de beslissing.
- Policy-weigeringen: probeer `Resume task` op `rel-01` (status `approval_required`) en de console weigert met uitleg.
- Dark/light theme, responsive layout, toetsenbordbediening, `Escape` sluit panelen.

### Nog mock

| Onderdeel | Status | Waar |
| --- | --- | --- |
| Alle domeindata | Statische fixtures, geanker op het laadmoment | `src/data/*` |
| Service-implementatie | In-memory, met 60 ms kunstmatige latency | `src/services/mock/*` |
| Realtime-transport | `subscribe` vuurt bij lokale mutaties; `StreamStatus` is fixture-data | `src/services/mock/index.ts` |
| Persistentie | Geen. Alles behalve het thema is weg na een reload | — |
| Authenticatie en autorisatie | Afwezig. Beslissingen worden toegeschreven aan `operator` | `services/mock/index.ts` |
| Systeemgezondheid | Vaste waarden, geen echte probes | `src/data/health.ts` |
| Trendgrafieken | Deterministische reeksen, geen echte tijdreeks | `src/data/health.ts` |
| Externe links | Wijzen naar niet-bestaande GitHub/Jira-URL's | overal in `src/data` |
| Paginering | `Page<T>` is gedefinieerd maar wordt nog niet gebruikt | `types/common.ts` |

De Settings-pagina toont welke implementatie actief is en heeft een knop om de lokale state terug te zetten naar de fixtures.

---

## 6. Voorstel voor de koppeling met echte agents

### Stap 1 — Eén bestand omzetten

De hele frontend hangt aan `src/services/index.ts`:

```ts
export const services: ServiceRegistry = mockServices;
```

Een REST-implementatie vervangt die regel:

```ts
const backend = createRestServices({ baseUrl: import.meta.env.VITE_API_BASE_URL });
const stream  = createWebSocketRealtime({ url: import.meta.env.VITE_WS_URL });

export const services: ServiceRegistry = { ...backend, realtime: stream, kind: 'websocket' };
```

Componenten hoeven niet te veranderen, omdat ze alleen de interfaces kennen.

### Stap 2 — De endpoints

De service-interfaces vertalen één-op-één naar een REST-oppervlak:

| Interface-methode | Endpoint |
| --- | --- |
| `agents.list()` | `GET /api/agents` |
| `agents.getDetail(id)` | `GET /api/agents/{id}` |
| `agents.getLogs(id, limit)` | `GET /api/agents/{id}/logs?limit=` |
| `agents.sendCommand(id, cmd)` | `POST /api/agents/{id}/commands` |
| `tasks.list()` | `GET /api/tasks` |
| `tasks.retry(id)` / `reassign` | `POST /api/tasks/{id}/retry` / `/assignee` |
| `activity.query(filter, limit)` | `GET /api/events?agent=&type=&since=` |
| `approvals.list()` | `GET /api/approvals` |
| `approvals.resolve(id, res, c)` | `POST /api/approvals/{id}/decision` |
| `repositories.list()` | `GET /api/repositories` |
| `metrics.summary()` / `health()` | `GET /api/metrics/summary` / `GET /api/health` |

Omdat elk domeinobject al JSON-serialiseerbaar is (ISO-strings, geen klassen, geen `Date`), is er geen mapping-laag nodig — hooguit validatie aan de rand.

### Stap 3 — Push in plaats van polling

`RealtimeService` is bewust minimaal: `status()` en `subscribe(listener)`. Voor v1 van de backend volstaat een SSE-stream (`GET /api/stream`, `text/event-stream`) die bij elke wijziging een hint stuurt; de client hertrekt dan de betrokken resource. Voor v2 is een WebSocket met getypeerde payloads logisch, waarbij `subscribe` een `DomainEvent` doorgeeft in plaats van een kale notificatie — dat is een uitbreiding van het interface, geen herschrijving.

Praktisch: begin met SSE. Het overleeft proxies beter, herverbindt vanzelf, en de console heeft geen bidirectioneel kanaal nodig — commando's gaan gewoon over POST.

### Stap 4 — De agent-runtime

De console beheert agents, hij draait ze niet. De backend heeft daarvoor nodig:

1. **Een runner-pool** die agentprocessen in een sandbox start (per taak een eigen workspace en container).
2. **Een event-bus** waar runners hun logs, tool-calls en statusovergangen op publiceren. Dat is waar `ActivityEvent`, `AgentLog` en `ToolExecution` vandaan komen.
3. **Een policy-enforcer die serverside draait.** Dit is het belangrijkste punt: `src/lib/policy.ts` is nu de bron voor de *interface*, maar handhaving hoort in de runtime. De agent mag een gated actie niet kunnen uitvoeren en daarna om vergeving vragen — de tool-call moet worden onderschept, een `ApprovalRequest` opleveren, en de agent blokkeren tot er een beslissing is. Deel de regeltabel tussen frontend en backend (bijvoorbeeld als los npm-pakket of gegenereerd uit één YAML) zodat ze niet uit elkaar lopen.
4. **Connectors** voor GitHub, Jira en CI. De `HealthCheck`-entries in dit dashboard corresponderen één-op-één met wat er dan gemonitord moet worden.

### Stap 5 — Wat er nog bij moet vóór productie

- **Authenticatie en rollen.** Een approval-beslissing moet toe te schrijven zijn aan een echte persoon; `ApprovalDecision.decidedBy` staat er al klaar voor. Overweeg vier-ogen-goedkeuring voor `risk: 'critical'`.
- **Auditlog.** Onveranderlijk, los van de event-tijdlijn, met minimaal: wie, wat, wanneer, welke policy rule, en de exacte voorgestelde wijziging.
- **Paginering en virtualisatie.** `Page<T>` bestaat al; de tijdlijn en logweergave hebben virtualisatie nodig zodra het om tienduizenden regels gaat.
- **Budgetbewaking met tanden.** `CostUsage.budgetLimit` wordt nu alleen getoond. In productie moet een overschrijding de agent daadwerkelijk pauzeren.
- **Optimistic updates met rollback**, zodat een commando direct voelt maar een serverweigering zichtbaar terugdraait.

---

## 7. Ontwerpuitgangspunten

Waar de interface op is geijkt: GitHub Actions, Kubernetes-dashboards, Azure DevOps, Grafana en moderne incident-managementsoftware. Concreet betekende dat:

- **Informatiedichtheid boven witruimte.** Basis-tekstgrootte 12 px, tabelrijen van 28 px, `text-2xs` (11 px) voor metadata. Een operator moet de hele vloot in één blik zien.
- **Tabellen zijn eersteklas.** Sticky headers, tabellarische cijfers zodat kolommen uitlijnen, rechts uitgelijnde getallen.
- **Subtiele randen, geen slagschaduwen.** Panelen worden gescheiden door 1 px randen, niet door diepte-effecten.
- **De gevaarlijkste informatie krijgt de meeste ruimte.** In het Approval Center staan de knoppen bewust ónder het bewijs: je scrollt langs de diff voordat je bij Approve komt.
- **Geen decoratie.** Geen illustraties, geen gradients, geen hero-secties. Elk pixel is een feit of een affordance.

---

## Licentie

Interne tooling; geen licentie meegeleverd.

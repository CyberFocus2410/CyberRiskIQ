# CyberRiskIQ Design System & Visual Identity Specification

CyberRiskIQ's visual identity reflects an authoritative quantitative cyber risk and investment platform designed for CISOs, Board Directors, and Enterprise Security Architects.

---

## 1. Color Palette & Tactical Tokens

The color system avoids generic dashboard blues and flat gray scaffolding. It establishes a high-contrast tactical void background with sharp signal accents reserved strictly for status communication and risk quantification.

### Base Surfaces
| Token | Hex | Role |
| :--- | :--- | :--- |
| `void` | `#08090D` | Root canvas / Deepest background |
| `surface` | `#0D1117` | Standard card containers, table headers |
| `surface-subtle` | `#121620` | Secondary nested panels |
| `surface-elevated`| `#161B26` | Modals, flyouts, dropdowns |
| `surface-highlight`| `#1E2536` | Hover states, active table rows |

### Tactical Borders
| Token | Hex | Role |
| :--- | :--- | :--- |
| `border-subtle` | `#1C2333` | Internal divider lines |
| `border-tactical` | `#26324B` | Primary card outlines |
| `border-strong` | `#3B4B6E` | Active / focused input rings |

### Signal & Risk Accents
| State | Hex | Usage |
| :--- | :--- | :--- |
| **Signal Cyan** | `#00F0FF` | Primary brand accent, active graph telemetry, scan probe pulse |
| **Signal Emerald** | `#10B981` | Optimal control posture, positive ROSI, completed scans |
| **Signal Amber** | `#F59E0B` | Medium / High severity risk, warning alerts |
| **Signal Rose** | `#EF4444` | Critical vulnerabilities, budget overruns, failed state |
| **Signal Indigo** | `#6366F1` | AI Risk Analyst interactions, scenarios |

---

## 2. Typography Pairing

- **Display & Headings**: `Plus Jakarta Sans`, `Inter`, `sans-serif`
  - High-contrast geometric sans-serif with tight tracking (`tracking-tight`, `-0.02em`) for authoritative headings and metric cards.
- **Body Text**: `Inter`, `-apple-system`, `sans-serif`
  - Clean readability across dense financial matrices and control lists.
- **Data & Metrics**: `JetBrains Mono`, `Fira Code`, `monospace`
  - Monospace font with tabular numbers (`tnum`) for currency (₹ Lakh / Cr), CVSS scores, EAL values, IDs (`AST-001`), and terminal logs.

---

## 3. Spacing & Elevation System

- **Screen Padding**: `p-6 lg:p-8`
- **Section Gap**: `space-y-6`
- **Card Padding**: `p-5` or `p-6`
- **Border Radius**: `rounded-xl` (`12px`) for cards/modals, `rounded-lg` (`8px`) for buttons/inputs, `rounded-md` (`6px`) for badges.
- **Shadows**: Tactical dark ambient elevation (`box-shadow: 0 4px 20px -2px rgba(0,0,0,0.6)`).

---

## 4. Unified ECharts Theme

All charts import and register themes from `src/utils/echartsTheme.js`:
- Dark Theme: `cyberriskiq-dark`
- Light Theme: `cyberriskiq-light`
- Tooltips: Translucent obsidian background (`#0D1117`), monospace values, crisp `#26324B` border.
- Series Gradients: Smooth cyan-to-indigo for EAL curves and emerald for ROSI curves.

---

## 5. Component Patterns

- **Tactical Card**:
  ```jsx
  <div className="bg-white dark:bg-[#0D1117] border border-zinc-200 dark:border-[#1E2638] rounded-xl p-6 shadow-sm">
    ...
  </div>
  ```
- **Signal Badge**:
  ```jsx
  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
    CRITICAL
  </span>
  ```

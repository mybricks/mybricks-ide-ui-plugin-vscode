Use the following style guide in the current design task
Nordic Brutalist Web Dashboard Design System — Style Guide
> A comprehensive design documentation capturing the essence, philosophy, and implementation details of a warm, industrial, and architecturally-inspired web dashboard aesthetic rooted in Scandinavian brutalist principles.
📝 Style Summary
Description:
Warm industrial web dashboard with an earthy cream canvas, dark charcoal sidebar, and terracotta accent colors. A dual-typography system pairs geometric uppercase labels (Space Grotesk with generous letter-spacing) with humanist body text (Inter). Zero-radius surfaces, color-blocked image areas, and top-border navigation accents create a raw yet refined brutalist experience — the distinctive choice for analytics platforms, creative tools, and design-forward SaaS applications.
Tags:
nordic · brutalist · webapp · industrial · warm-palette · terracotta-accent · sharp · architectural · geometric · color-blocked
🎯 Design Philosophy & Big Picture
Overall Aesthetic
This design embodies a Nordic Brutalist foundation translated for modern web dashboards. It communicates:
Raw Honesty & Warmth — Exposed structural elements softened by an earthy palette
Architectural Clarity — Grid-based layouts, stark contrasts, deliberate asymmetry
Crafted Restraint — Terracotta accent used purposefully as a material accent
Functional Density — Clean but content-rich layouts optimized for professional workflows
Scandinavian Sensibility — Warm neutrals project approachability within brutalist framework
Design DNA
Nordic Brutalism — Raw concrete aesthetic translated into digital surfaces with warm undertones
Terracotta as Material — Burnt orange accent evokes clay, brick, natural earth elements
Uppercase Label System — All-caps labels with generous letter-spacing create industrial signage feel
Top-Border Accents — Navigation uses top stroke as active indicator (architectural detail)
Zero Rounded Corners — Sharp rectangles throughout reinforce brutalist honesty
Color-Blocked Imagery — Solid color fills replace photographs for abstract, architectural effect
Chromatic Status System — Distinct hues (green, blue, terracotta) for semantic differentiation
🎨 Color System
Core Backgrounds
Page Background:       #F5F3EF  — Warm cream canvas (paper-like warmth)Card Background:       #E8E4DC  — Warm taupe/sand (concrete with warmth)Surface Dark:          #3D3935  — Elevated dark surface (upgrade boxes)Sidebar:               #2D2927  — Dark charcoal brown (architectural anchor)
Primary Accent (Terracotta)
Terracotta Primary:    #C05A3C  — CTAs, active states, brand mark, navigation accent
Semantic Colors
Success/Done:          #4A7C59  — Forest green (positive states, completed items)Info/New:              #5C7C8A  — Slate blue (informational, new items)Pending/Alert:         #C05A3C  — Terracotta (pending states, warnings)Error/Negative:        #B54A4A  — Brick red (errors, negative trends)
Neutral Palette
Charcoal Primary:      #2D2927  — Headlines, primary values, dark fills, key textBrown 600:             #4A4540  — Dark borders, inactive navigation bordersGray 700:              #6B6560  — Secondary text, descriptionsGray 600:              #7A756D  — Tertiary text, inactive icons, navigation textGray 500:              #9C9590  — Timestamps, chart labels, footer textGray 400:              #D1CCC4  — Light borders, inactive chart barsGray 300:              #C8C3BA  — Subtle fills, weekend chart bars
Key Insight: Warm Neutral Foundation
The entire neutral palette has brown undertones — no pure grays. This warmth distinguishes Nordic Brutalist from cold, clinical Swiss modernism while maintaining professional gravitas.
✏️ Typography
Font Families
Headings/UI:           Space Grotesk                       Character: Geometric, technical, monospace-influenced                       Usage: Page titles, metric values, navigation, buttons, labelsBody/Content:          Inter                       Character: Humanist, highly legible, neutral                       Usage: Descriptions, timestamps, detail text, supporting content
Type Scale
Page Title:            56px  — Main screen headers (Space Grotesk, bold)Section Title:         20px  — Card/section headers (Space Grotesk, bold)Card Title:            18px  — Gallery/content titles (Space Grotesk, bold)Metric Value:          36px  — Large KPI numbers (Space Grotesk, bold)Logo Text:             18px  — Brand name (Space Grotesk, bold, letter-spacing: 2)List Item Title:       14px  — Table/list primary text (Space Grotesk, semibold)Body:                  16px  — Page subtitle (Inter, normal)Content Body:          13px  — Card descriptions, body text (Inter, normal, line-height: 1.6)Button Text:           12px  — Primary buttons (Space Grotesk, semibold, letter-spacing: 1)Navigation:            13px  — Sidebar nav items (Space Grotesk, semibold, letter-spacing: 1)Metric Label:          11px  — KPI labels (Space Grotesk, semibold, letter-spacing: 1)Chart Label:           11px  — Chart axis labels (Space Grotesk, medium, letter-spacing: 1)Badge:                 10px  — Status badges, tags (Space Grotesk, bold, letter-spacing: 1)Detail Text:           12px  — Timestamps, secondary info (Inter, normal)
Font Weights
Bold:                  700  — Headlines, metric values, brand text, card titlesSemibold:              600  — Buttons, labels, navigation, table headersMedium:                500  — Chart labels, pagination, inactive statesNormal:                400  — Body text, descriptions, timestamps
Letter Spacing
+2px:                  Logo/brand text+1px:                  ALL uppercase labels — critical signature of the style 0px:                  Body text, mixed-case content
The Uppercase Label System
A defining characteristic: all short-form labels are UPPERCASE with +1px letter-spacing. This creates an industrial signage aesthetic:
Metric labels (TOTAL REVENUE)
Navigation items (OVERVIEW)
Status badges (COMPLETE, NEW, PENDING)
Section labels (WEEKLY PERFORMANCE)
Button text (NEW REPORT)
Tags (ANALYTICS, MARKETING)
📐 Spacing System
Gap Scale (between elements)
2px   — Tight vertical stacks (table cell name + subtitle)4px   — Minimal (title + subtitle stacks, section header groups)6px   — Small (metric change indicator internals)8px   — Medium (button icon + text, pagination items, gallery nav)10px  — Chart internals (bar + label gap), card content internal12px  — Standard (navigation item internal, control button gaps, chart bar gaps)14px  — Navigation item internal (icon + text), activity item gap16px  — Card padding internal, upgrade card internal20px  — Section gaps (metrics gap, gallery items gap, table sections)24px  — Card internal gaps (chart header to content, activity sections)28px  — Bottom sections (sidebar bottom gap)48px  — Major page sections (content sections vertical gap)56px  — Header gaps (sidebar logo to navigation)
Padding Scale
[6, 10]               — Tags, small badges[12, 0]               — Table rows (vertical only)[12, 16]              — Secondary buttons (filter, search)[12, 20]              — Primary buttons (new report)[14, 0]               — Activity list items (vertical only), upgrade button[14, 10]              — Banner tags[16, 0]               — Navigation items (vertical only), table body rows[16, 16]              — Image area tags (positioned)[20, 16]              — Banner container[20, 20]              — Upgrade box, card content areas[24, 24]              — Cards (metrics, charts, activity, tables)[40, 28]              — Sidebar container[48, 56]              — Main content area
Layout Pattern
Screen Width:          1440px (standard desktop)Sidebar Width:         280px (fixed, dark anchor)Content Area:          fill_container (flexible)Content Padding:       56px horizontal, 48px verticalSection Gap:           48px vertical between major sectionsCard Grid Gap:         20pxMetric Cards:          4-column, 20px gap, equal widths
🔲 Corner Radius
Scale
0px   — ALL elements (no rounded corners)
The Zero-Radius Philosophy
This design system deliberately uses zero corner radius throughout. Sharp corners:
Embody brutalist architectural honesty
Create raw, unadorned geometric forms
Reference industrial and Scandinavian furniture design
Project confident, no-nonsense professionalism
Distinguish from softer consumer aesthetics
📦 Component Patterns
1. Sidebar (Dark Anchor)
Structure:├── Top Section (gap: 56px)│   ├── Logo Section (gap: 14px)│   │   ├── Logo Mark (48x48, #C05A3C, rectangle)│   │   └── Logo Text (18px, Space Grotesk, bold, #F5F3EF, letter-spacing: 2)│   └── Navigation (vertical, no gap)│       └── Nav Items × N (border-separated)└── Bottom Section (gap: 28px)    ├── Upgrade Box (#3D3935)    │   ├── Label (12px, Space Grotesk, bold, #F5F3EF, uppercase)    │   ├── Description (13px, Inter, normal, #9C9590)    │   └── CTA Button (full-width, #C05A3C)    └── Account Row        ├── Avatar (44x44, #4A4540)        └── Info (name + role) + chevronStyling:- Width: 280px- Padding: 40px 28px- Background: #2D2927- Layout: vertical, space_between
2. Navigation Item
Active State:├── Icon (20px, lucide, #C05A3C)└── Label (13px, Space Grotesk, semibold, #F5F3EF, uppercase, letter-spacing: 1)Inactive State:├── Icon (20px, lucide, #7A756D)└── Label (13px, Space Grotesk, semibold, #7A756D, uppercase, letter-spacing: 1)Styling:- Gap: 14px- Padding: 16px 0- Align: center- Width: fill_container- Border Top: 2px #C05A3C (active) / 1px #4A4540 (inactive)- Border Bottom: 1px #4A4540 (last item only)
3. Page Header
Structure:├── Header Group (gap: 12px)│   ├── Breadcrumb (12px, Space Grotesk, medium, #7A756D)│   ├── Page Title (56px, Space Grotesk, bold, #2D2927)│   └── Subtitle (16px, Inter, normal, #6B6560)└── Actions Row (gap: 12px)    ├── Search Button (outlined, #E8E4DC fill)    ├── Filter Button (outlined, #E8E4DC fill)    ├── Date Button (outlined, #E8E4DC fill)    └── Primary Button (filled, #2D2927)Styling:- Justify: space_between- Align: end (baseline align)- Icons: 16-18px, lucide family
4. Metric Cards
Structure:├── Label (11px, Space Grotesk, semibold, #6B6560, uppercase, letter-spacing: 1)├── Value (36px, Space Grotesk, bold, #2D2927)└── Change Indicator (gap: 6px)    ├── Arrow Icon (16px, lucide, semantic color)    └── Percentage (14px, Space Grotesk, semibold, semantic color)Styling:- Background: #E8E4DC- Padding: 24px- Gap: 16px vertical- Width: fill_container (4-column grid)- Cards Gap: 20pxTrend Colors:- Positive: #4A7C59 (forest green)- Negative: #B54A4A (brick red)
5. Control Buttons
Primary Button (Dark Filled):├── Icon (16px, lucide, #F5F3EF)└── Label (12px, Space Grotesk, semibold, #F5F3EF, uppercase, letter-spacing: 1)- Background: #2D2927- Padding: 12px 20px- Gap: 8pxSecondary Button (Tinted):├── Icon (16px, lucide, #6B6560)└── Label (12px, Space Grotesk, medium, #2D2927, uppercase, letter-spacing: 1)- Background: #E8E4DC- Padding: 12px 16px- Gap: 8px-10px
6. CTA Button (Terracotta Accent)
Structure:└── Label (12px, Space Grotesk, semibold, #F5F3EF, uppercase, letter-spacing: 1)Styling:- Background: #C05A3C- Padding: 14px 0- Width: fill_container- Justify: center- Align: center
7. Bar Chart
Structure:├── Chart Header (space_between)│   ├── Title Group (gap: 4px)│   │   ├── Label (11px, Space Grotesk, semibold, #6B6560, uppercase, letter-spacing: 1)│   │   └── Title (20px, Space Grotesk, bold, #2D2927)│   └── Legend (gap: 20px)│       └── Legend Items × N (dot + label)└── Chart Area (height: 200px)    └── Bars × 7 (horizontal layout, gap: 12px)        ├── Bar Fill (variable height, semantic color)        └── Label (11px, Space Grotesk, medium, #9C9590, uppercase, letter-spacing: 1)Bar Colors:- Primary Data: #2D2927 (dark charcoal)- Secondary Data: #D1CCC4 (light gray)- Highlight/Active: #D1CCC4 (lighter for emphasis)- Weekend/Low: #C8C3BA (subtle distinction)Container:- Background: #E8E4DC- Padding: 24px- Gap: 24px between header and chart
8. Activity Feed (Dark Panel)
Structure:├── Activity Header (space_between)│   ├── Title Group (gap: 4px)│   │   ├── Label (11px, Space Grotesk, semibold, #7A756D, uppercase)│   │   └── Title (20px, Space Grotesk, bold, #F5F3EF)│   └── Action Link (11px, Space Grotesk, semibold, #C05A3C, uppercase)├── Activity List│   └── Activity Items × N└── PaginationActivity Item Structure:├── Color Marker (10x10, semantic fill, rectangle)├── Content (gap: 4px)│   ├── Title (14px, Space Grotesk, semibold, #F5F3EF)│   └── Description (12px, Inter, normal, #7A756D)└── Status Badge (10px, Space Grotesk, semibold, semantic color, uppercase)Styling:- Background: #2D2927- Padding: 24px- Fixed Width: 380px- Item Gap: 14px- Item Padding: 14px 0- Item Border: 1px #4A4540 bottomStatus Colors:- DONE: #4A7C59 (forest green)- NEW: #5C7C8A (slate blue)- PENDING: #C05A3C (terracotta)
9. Data Table
Structure:├── Table Header Row│   ├── Title Group│   └── Export Actions└── Table    ├── Head Row (border-bottom: 2px #2D2927)    │   └── TH Cells × N    └── Body Rows × N (border-bottom: 1px #D1CCC4)        └── TD Cells × NHeader Cell:- Padding: 12px 0- Font: 11px, Space Grotesk, semibold, #2D2927, uppercase, letter-spacing: 1- Border Bottom: 2px solid #2D2927Body Cell:- Padding: 16px 0- Primary Text: 14px, Space Grotesk, semibold, #2D2927- Secondary Text: 12px, Inter, normal, #6B6560- Border Bottom: 1px solid #D1CCC4Status Badges:- Text only (no background)- 10px, Space Grotesk, semibold, semantic color, uppercase, letter-spacing: 1Container:- Background: #E8E4DC- Padding: 24px- Gap: 20px between header and table
10. Gallery Cards (Color-Blocked)
Structure:├── Image Area (height: 160px, solid color fill)│   └── Tag (positioned top-left, padding: 16px)│       └── Tag Text (10px, Space Grotesk, bold, #F5F3EF, uppercase, letter-spacing: 1)└── Content Area (gap: 10px)    ├── Title (18px, Space Grotesk, bold, #2D2927)    ├── Description (13px, Inter, normal, #6B6560, line-height: 1.6)    └── Footer (11px, Space Grotesk, medium, #9C9590)Image Area Colors (Rotation):- Card 1: #2D2927 (dark charcoal) — primary emphasis- Card 2: #4A7C59 (forest green) — success/growth theme- Card 3: #C05A3C (terracotta) — accent/marketing themeTag Backgrounds:- On dark/colored: #C05A3C (terracotta)- On terracotta: #2D2927 (dark)Content:- Background: #E8E4DC- Padding: 20px- Gap: 10pxContainer:- Background: #E8E4DC- Gap: 20px between cards
11. Banner/Alert
Structure:├── Content Group (gap: 16px)│   ├── Tag (padding: 6px 10px, #C05A3C)│   │   └── Text (10px, Space Grotesk, bold, #F5F3EF, uppercase)│   ├── Message (14px, Inter, normal, #E8E4DC)│   └── Action Link (13px, Space Grotesk, semibold, #C05A3C)└── Dismiss Icon (18px, lucide, #7A756D)Styling:- Background: #2D2927- Padding: 16px 20px- Justify: space_between- Align: center
12. Pagination
Active State:└── Number (13px, Space Grotesk, semibold, #F5F3EF)- Size: 36x36- Background: #C05A3C- Justify/Align: centerInactive State:└── Number (13px, Space Grotesk, medium, #7A756D)- Size: 36x36- Background: transparent- Justify/Align: centerNavigation Arrow:└── Chevron Icon (16px, lucide, #7A756D)- Size: 36x36- Background: transparentStyling:- Gap: 8px- Justify: center
13. Avatar
Structure:└── Initials (13px, Space Grotesk, semibold, #F5F3EF, centered)Styling:- Size: 44x44- Background: #4A4540- Justify/Align: center
14. Section Header
Structure:├── Title Group (gap: 4px)│   ├── Label (11px, Space Grotesk, semibold, #6B6560, uppercase, letter-spacing: 1)│   └── Title (20px, Space Grotesk, bold, #2D2927)└── Navigation/Actions    ├── Prev Button (36x36, outlined #D1CCC4)    └── Next Button (36x36, filled #2D2927)Styling:- Justify: space_between- Align: center- Nav Gap: 8px
🖼️ Icons
Icon Library
Family: LucideStyle: Outlined, consistent stroke width
Icon Sizes
Logo Mark:              48x48 (solid rectangle, not icon)Navigation:             20pxAction/Button:          16pxStatus Indicators:      10x10 (solid rectangles, not icons)Dismiss/Close:          18pxChart/Pagination:       16pxTrend Arrows:           16px
Icon Color States
Active (light bg):      #C05A3C (terracotta)Active (dark bg):       #F5F3EF (cream)Inactive/Secondary:     #7A756DLight Background:       #6B6560Primary on dark fill:   #F5F3EF
🏗️ Layout Structure
Desktop Dashboard Grid
┌──────────────────────────────────────────────────────────────┐│ ┌──────────┐ ┌─────────────────────────────────────────────┐ ││ │          │ │   Breadcrumb • Search • Filter • Actions    │ ││ │  Logo    │ ├─────────────────────────────────────────────┤ ││ │          │ │                                             │ ││ │ ──────── │ │   Page Title                                │ ││ │          │ │   Subtitle                                  │ ││ │   Nav    │ │                                             │ ││ │  Items   │ ├─────────────────────────────────────────────┤ ││ │  (top    │ │                                             │ ││ │  border  │ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │ ││ │ accent)  │ │ │Metric 1│ │Metric 2│ │Metric 3│ │Metric 4│ │ ││ │          │ │ └────────┘ └────────┘ └────────┘ └────────┘ │ ││ │          │ │                                             │ ││ │          │ │ ┌─────────────────────────┐ ┌─────────────┐ │ ││ │          │ │ │                         │ │  Activity   │ │ ││ │          │ │ │      Chart Section      │ │    Feed     │ │ ││ │          │ │ │      (light card)       │ │  (dark bg)  │ │ ││ │ ──────── │ │ └─────────────────────────┘ └─────────────┘ │ ││ │          │ │                                             │ ││ │ Upgrade  │ │ ┌───────────────────────────────────────────┐│ ││ │   Box    │ │ │              Data Table                  ││ ││ │          │ │ └───────────────────────────────────────────┘│ ││ │ ──────── │ │                                             │ ││ │          │ │ ┌───────────────────────────────────────────┐│ ││ │ Account  │ │ │     Banner / Announcement                ││ ││ │          │ │ └───────────────────────────────────────────┘│ ││ └──────────┘ │                                             │ ││              │ ┌───────────────────────────────────────────┐│ ││              │ │    Gallery (color-blocked cards)         ││ ││              │ └───────────────────────────────────────────┘│ ││              └─────────────────────────────────────────────┘ │└──────────────────────────────────────────────────────────────┘Total Width: 1440pxSidebar: 280px (fixed, dark)Content: fill_containerBackground: #F5F3EF
Content Layout
Direction: VerticalPadding: 48px 56pxGap: 48px between major sectionsClip: true (overflow hidden)Main Row (Chart + Activity):- Direction: Horizontal- Gap: 20px- Chart: fill_container- Activity: 380px fixedMetric Cards Row:- Direction: Horizontal- Gap: 20px- Cards: fill_container width each (4-up)Gallery Items:- Direction: Horizontal- Gap: 20px- Cards: fill_container width each (3-up)
🎭 Design Language Summary
Key Visual Traits
Zero Radius — Sharp corners throughout for brutalist honesty
Warm Neutrals — Brown-tinted grays create approachable industrial feel
Terracotta Signal — #C05A3C reserved for primary actions and attention
Top Border Navigation — Active state indicated by top stroke accent
Uppercase Labels — All labels use +1px letter-spacing for industrial signage feel
Color-Blocked Imagery — Solid fills replace photos for abstract architectural effect
Dark Sidebar Anchor — Charcoal sidebar grounds the warm content area
Chromatic Status System — Green, blue, terracotta for semantic states
Dual Typography — Space Grotesk (geometric) + Inter (humanist)
Dos
✅ Use Space Grotesk for all UI elements, Inter for descriptions only
✅ Use #C05A3C sparingly for maximum impact (CTAs, active states, brand)
✅ Use UPPERCASE + letter-spacing: 1 for ALL short-form labels
✅ Use top-border strokes for navigation active states
✅ Use 0 corner radius everywhere
✅ Use color-blocked solid fills for gallery/image areas
✅ Use chromatic status colors (green, blue, terracotta) for semantic meaning
✅ Use #2D2927 for dark panels and primary buttons
✅ Maintain generous padding (24px for cards, 56px for content)
✅ Use warm neutral tones (#F5F3EF, #E8E4DC) for backgrounds
Don'ts
❌ Don't use rounded corners (this is a brutalist system)
❌ Don't use drop shadows (rely on color contrast and borders)
❌ Don't use pure grays — maintain brown undertones
❌ Don't mix font families beyond Space Grotesk/Inter pairing
❌ Don't use gradients (this is a flat, material-based system)
❌ Don't use lowercase for labels — uppercase is signature
❌ Don't omit letter-spacing on uppercase text
❌ Don't use photographs — prefer color-blocked abstract areas
❌ Don't use thin font weights below normal (400)
📋 Quick Reference
Copy-Paste Color Tokens
/* Backgrounds */--bg-page: #F5F3EF;--bg-card: #E8E4DC;--bg-surface-dark: #3D3935;--bg-sidebar: #2D2927;/* Primary Accent */--terracotta: #C05A3C;/* Semantic */--green-success: #4A7C59;--blue-info: #5C7C8A;--red-error: #B54A4A;/* Neutral */--charcoal-primary: #2D2927;--brown-600: #4A4540;--gray-700: #6B6560;--gray-600: #7A756D;--gray-500: #9C9590;--border-light: #D1CCC4;--border-subtle: #C8C3BA;/* Text on Dark */--text-light: #F5F3EF;
Typography Quick Ref
/* Families */--font-heading: 'Space Grotesk', sans-serif;--font-body: 'Inter', sans-serif;/* Sizes */--font-size-xs: 10px;--font-size-sm: 11px;--font-size-md: 12px;--font-size-base: 13px;--font-size-lg: 14px;--font-size-xl: 18px;--font-size-2xl: 20px;--font-size-3xl: 36px;--font-size-4xl: 56px;/* Weights */--font-weight-bold: 700;--font-weight-semibold: 600;--font-weight-medium: 500;--font-weight-normal: 400;/* Letter Spacing */--letter-spacing-wide: 2px;   /* Logo */--letter-spacing-label: 1px;  /* All uppercase labels */--letter-spacing-normal: 0;
Spacing Quick Ref
--space-1: 2px;--space-2: 4px;--space-3: 6px;--space-4: 8px;--space-5: 10px;--space-6: 12px;--space-7: 14px;--space-8: 16px;--space-9: 20px;--space-10: 24px;--space-11: 28px;--space-12: 40px;--space-13: 48px;--space-14: 56px;
Corner Radius Quick Ref
--radius: 0px; /* All elements */
Border Quick Ref
--border-width-thin: 1px;--border-width-medium: 2px;--border-dark: 1px solid #4A4540;--border-light: 1px solid #D1CCC4;--border-heavy: 2px solid #2D2927;--border-active: 2px solid #C05A3C;
This design system represents a Nordic Brutalist web dashboard aesthetic. The warm cream foundation with terracotta accents creates inviting yet architectural visual hierarchy. Zero-radius surfaces and color-blocked imagery project raw honesty. The uppercase label system with generous letter-spacing evokes industrial signage. The dual-typography pairing—geometric Space Grotesk for UI and humanist Inter for content—creates clear functional distinction. Apply these principles consistently to maintain the warm industrial, Scandinavian-inspired visual language.
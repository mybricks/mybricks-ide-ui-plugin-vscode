Use the following style guide in the current design task
Scandinavian Minimal Web Dashboard Design System — Style Guide
> A comprehensive design documentation capturing the essence, philosophy, and implementation details of a warm, nature-inspired web dashboard aesthetic rooted in Nordic design principles.
📝 Style Summary
Description:
Warm, organic web dashboard with a soft off-white background, sage green accents, and a dual-typography system pairing elegant serif headings (Fraunces) with modern geometric body text (Plus Jakarta Sans). Generous corner radii, ultra-soft shadows, and a nature-inspired palette create a calm, approachable experience — the ideal choice for lifestyle apps, wellness platforms, sustainable business tools, and SaaS applications that prioritize human-centered design.
Tags:
scandinavian · webapp · minimal · organic · warm · nature · rounded · soft · serif-accent · calm
🎯 Design Philosophy & Big Picture
Overall Aesthetic
This design embodies a Nordic Minimalism foundation translated for modern web dashboards. It communicates:
Warmth & Approachability — Soft edges, warm tones, nature-derived colors
Organic Calm — Muted palette with sage green accents evokes natural environments
Editorial Elegance — Serif display typography adds sophistication and character
Breathable Space — Generous padding and subtle contrasts create visual rest
Modern Craft — Clean layouts with artisanal touches in typography and color
Design DNA
Nordic Minimalism — Clean, functional, human-centered design
Sage as Anchor — Moss green accent (#7C9070) grounds the interface naturally
Serif-Sans Pairing — Fraunces (serif) for display, Plus Jakarta Sans (sans) for UI
Whisper Shadows — Ultra-subtle shadows suggest depth without weight
Rounded Everything — Soft 8-16px radii eliminate harshness
Warm Paper Base — Off-white (#F7F6F3) background feels natural and restful
Horizontal Navigation — Top nav pattern for broader, more open layouts
🎨 Color System
Core Backgrounds
Page Background:       #F7F6F3  — Warm off-white, natural paper toneCard Background:       #FFFFFF  — Pure white for cards and content containersSurface Tint:          #FAFAF8  — Subtle warm gray for table headers, inputs
Primary Accent (Sage Green)
Sage Primary:          #7C9070  — CTAs, active states, brand elements, successSage Tint (15%):       #7C907015  — Background fills for active nav, badges, highlightsSage Tint (30%):       #7C907030  — Banner strokes, subtle borders
Neutral Palette
Black Soft:            #2D2D2D  — Headlines, primary text, filled buttonsGray 600:              #6B6B6B  — Secondary text, descriptionsGray 500:              #8E8E93  — Tertiary text, labels, placeholders, iconsGray Border:           #F0EFEC  — Borders, dividers (very subtle)Gray Inactive:         #E5E4E1  — Inactive pagination dots, disabled states
Secondary Accent Colors
Warm Taupe:            #C9B8A8  — User avatars, secondary chart elementsSky Blue:              #5B9BD5  — Information states, new indicatorsSky Blue Tint:         #5B9BD515  — Blue badge backgroundsTerracotta:            #D4845E  — Warning states, pending indicatorsTerracotta Tint:       #D4845E15  — Orange badge backgroundsMuted Lavender:        #9B8AA8  — Accent variety, category differentiationLavender Tint:         #9B8AA815  — Purple badge backgrounds
Key Insight: Tinted Backgrounds
Accent colors are used at 15% opacity for backgrounds, creating a cohesive tinted system where each semantic color has its matching soft background. This creates visual harmony while maintaining clear differentiation.
✏️ Typography
Font Families
Display/Headings:      Fraunces                       Character: Elegant serif, oldstyle numerals, organic                       Usage: Page titles, section headers, large metric valuesUI/Body:               Plus Jakarta Sans                       Character: Geometric, modern, highly legible, friendly                       Usage: Navigation, buttons, labels, descriptions, body textMonospace:             Space Mono                       Character: Technical, consistent width, clear                       Usage: Invoice numbers, data values, codes, percentages
Type Scale
Page Title:            40px  — Main screen headers (Fraunces, medium, -1 letter-spacing)Metric Value:          36px  — Large KPI numbers (Fraunces, medium, -1 letter-spacing)Section Title:         20px  — Card/section headers (Fraunces, medium)Logo Text:             20px  — Brand name (Plus Jakarta Sans, semibold, -0.5 letter-spacing)Card Title:            14px  — Gallery titles, emphasized content (Plus Jakarta Sans, semibold)Body/Navigation:       13px  — Nav items, buttons, table data (Plus Jakarta Sans, medium/semibold)Description:           14px  — Page subtitle (Plus Jakarta Sans, normal)Label:                 12px  — Input labels, subtitles, metadata (Plus Jakarta Sans, normal/medium)Chart/Table Label:     11px  — Chart axis labels, table headers, timestamps (Plus Jakarta Sans, medium)Badge:                 10px  — Status badges (Plus Jakarta Sans, semibold)
Font Weights
Semibold:              600  — Buttons, brand text, active navigation, badges, titlesMedium:                500  — Page titles, metric values, labels, section titlesNormal:                400  — Body text, descriptions, inactive states
Letter Spacing
-1px:                  Applied to page titles and large metric values (Fraunces)-0.5px:                Applied to logo text for tighter brand feelDefault (0):           All other text
📐 Spacing System
Gap Scale (between elements)
2px   — Tight vertical (activity item title + description)4px   — Minimal (title + subtitle stacks, legend icon + text)6px   — Small (pagination dots gap)8px   — Standard (nav links gap, button internal, chart legend items)10px  — Medium (search bar internal, table action buttons gap)12px  — Regular (logo internal, change indicator gap, chart bars gap)14px  — Activity item internal (avatar + content + badge)16px  — Large (nav right items, metric card internal)20px  — Section gap (cards gap, chart/table internal, gallery gap)32px  — Major sections (content sections gap)48px  — Navigation (logo to nav links gap)
Padding Scale
[3, 6]                — Keyboard shortcut badges[4, 8]                — Table status badges[4, 10]               — Metric change pills[5, 10]               — Activity badges[10, 14]              — Search bar, table action buttons[10, 16]              — Navigation items[12, 18]              — Secondary buttons (filter, date)[12, 22]              — Primary buttons (new report)[10, 18]              — Upgrade button[14, 0]               — Activity list items (vertical only)[14, 16]              — Table rows[16, 24]              — Banner[20, 20]              — Gallery card content[24, 24]              — Metric cards, chart cards, sections[20, 48]              — Top navigation (vertical, horizontal)[40, 48]              — Main content area
Layout Pattern
Screen Width:          1440px (standard desktop)Navigation:            Horizontal, full-width, fixed topContent Area:          fill_container (flexible)Content Padding:       40px vertical, 48px horizontalSection Gap:           32px vertical between major sectionsCard Grid Gap:         20pxMetrics Row:           4-column horizontal grid, 20px gap
🔲 Corner Radius
Scale
16px  — Large cards, main containers, charts, tables wrapper14px  — Banner containers12px  — Avatars, inner tables10px  — Buttons, inputs, search bars, nav items, logo mark8px   — Small buttons, secondary controls, bar chart tops6px   — Badges, small pills4px   — Tiny elements, keyboard shortcuts, pagination dots3px   — Legend dots
Bar Chart Radius
[8, 8, 0, 0]          — Bars rounded on top only, flat bottom
The Rounded Philosophy
This design system uses generous corner radii throughout. Soft corners:
Create a warm, approachable, human-centered feel
Align with Scandinavian design's organic sensibility
Reduce visual tension and harsh edges
Project friendliness and accessibility
📦 Component Patterns
1. Top Navigation
Structure:├── Nav Left (gap: 48px)│   ├── Logo (gap: 12px)│   │   ├── Logo Mark (36x36, #7C9070, cornerRadius: 10)│   │   └── Logo Text (20px, Plus Jakarta Sans, semibold, -0.5 letter-spacing)│   └── Nav Links (gap: 8px)│       └── Nav Item × N└── Nav Right (gap: 16px)    ├── Search Bar (220px width)    ├── Upgrade Button (#7C9070 filled)    └── User Avatar (40x40, #C9B8A8)Styling:- Background: #FFFFFF- Padding: 20px 48px- Shadow: blur 40px, y-offset 4px, color #00000008- Justify: space_between- Width: fill_container
2. Navigation Item
Active State:├── Icon (16px, lucide, #7C9070)└── Label (13px, Plus Jakarta Sans, semibold, #7C9070)Inactive State:├── Icon (16px, lucide, #8E8E93)└── Label (13px, Plus Jakarta Sans, medium, #8E8E93)Active Styling:- Background: #7C907015 (sage tint)- Padding: 10px 16px- Gap: 8px- Corner Radius: 8pxInactive Styling:- Background: transparent- Padding: 10px 16px- Gap: 8px- Corner Radius: 8px
3. Page Header
Structure:├── Header Left (gap: 8px)│   ├── Breadcrumbs (12px, Plus Jakarta Sans, medium, #8E8E93)│   ├── Page Title (40px, Fraunces, medium, -1 letter-spacing, #2D2D2D)│   └── Subtitle (14px, Plus Jakarta Sans, normal, #6B6B6B)└── Header Right (gap: 12px)    ├── Filter Button (outlined)    ├── Date Button (outlined)    └── Primary Button (filled)Styling:- Justify: space_between- Width: fill_container
4. Metric Cards
Structure:├── Header (space_between)│   ├── Label (13px, Plus Jakarta Sans, medium, #8E8E93)│   └── Status Dot (8x8, #7C9070, cornerRadius: 4)└── Value Row (gap: 12px, align: end)    ├── Value (36px, Fraunces, medium, #2D2D2D, -1 letter-spacing)    └── Change Pill        ├── Arrow Icon (12px, lucide, #7C9070)        └── Percent (11px, Space Mono, normal, #7C9070)Styling:- Border: none- Background: #FFFFFF- Corner Radius: 16px- Padding: 24px- Gap: 16px vertical- Shadow: blur 30px, y-offset 4px, color #00000006- Width: fill_container (4-column grid)- Cards Gap: 20pxChange Pill:- Background: #7C907015- Padding: 4px 10px- Corner Radius: 6px- Gap: 4px
5. Secondary Button (Outlined)
Structure:├── Icon (16px, lucide, #6B6B6B)└── Label (13px, Plus Jakarta Sans, medium, #2D2D2D)Styling:- Background: #FFFFFF- Padding: 12px 18px- Gap: 8px- Corner Radius: 10px- Shadow: blur 20px, y-offset 2px, color #00000008
6. Primary Button (Filled)
Structure:├── Icon (16px, lucide, #FFFFFF)└── Label (13px, Plus Jakarta Sans, semibold, #FFFFFF)Styling:- Background: #2D2D2D- Padding: 12px 22px- Gap: 8px- Corner Radius: 10px
7. Accent Button (Sage CTA)
Structure:├── Icon (14px, lucide, #FFFFFF)└── Label (13px, Plus Jakarta Sans, semibold, #FFFFFF)Styling:- Background: #7C9070- Padding: 10px 18px- Gap: 8px- Corner Radius: 10px
8. Search Bar
Structure:├── Search Icon (16px, lucide, #8E8E93)├── Placeholder (13px, Plus Jakarta Sans, normal, #8E8E93)└── Shortcut Badge    └── Text (10px, Plus Jakarta Sans, medium)Styling:- Background: #F7F6F3- Padding: 10px 14px- Gap: 10px- Corner Radius: 10px- Width: 220pxShortcut Badge:- Background: #FFFFFF- Padding: 3px 6px- Corner Radius: 4px
9. Bar Chart
Structure:├── Chart Header (space_between)│   ├── Title Group (gap: 4px)│   │   ├── Title (20px, Fraunces, medium, #2D2D2D)│   │   └── Subtitle (12px, Plus Jakarta Sans, normal, #8E8E93)│   └── Legend (gap: 20px)│       └── Legend Items × N│           ├── Dot (10x10, color, cornerRadius: 3)│           └── Label (12px, Plus Jakarta Sans, medium, #6B6B6B)└── Chart Area (height: 180px)    └── Bars × 7 (horizontal layout, gap: 12px)        ├── Bar Fill (variable height, cornerRadius: [8,8,0,0])        └── Label (11px, Plus Jakarta Sans, medium, #8E8E93)Bar Colors:- Primary: #7C9070 (sage)- Secondary: #C9B8A8 (taupe)Active Day Highlight:- Bar: #C9B8A8- Label: #2D2D2D, fontWeight: 600Container:- Background: #FFFFFF- Corner Radius: 16px- Padding: 24px- Gap: 20px- Shadow: blur 30px, y-offset 4px, color #00000006
10. Activity List
Structure:├── Header (space_between)│   ├── Title (20px, Fraunces, medium, #2D2D2D)│   └── View All Link (12px, Plus Jakarta Sans, semibold, #7C9070)├── Activity Items × N│   ├── Avatar (36x36, tinted bg, cornerRadius: 10)│   │   └── Icon (16px, lucide, accent color)│   ├── Content (gap: 2px)│   │   ├── Title (13px, Plus Jakarta Sans, semibold, #2D2D2D)│   │   └── Description (12px, Plus Jakarta Sans, normal, #8E8E93)│   └── Badge│       └── Text (10px, Plus Jakarta Sans, semibold, accent color)└── Pagination (gap: 6px, center)    └── Dots × 3 (8x8, cornerRadius: 4)Activity Item Styling:- Gap: 14px- Padding: 14px 0- Border Bottom: 1px solid #F0EFEC (except last)Badge Styling:- Background: accent color at 15%- Text: accent color at 100%- Padding: 5px 10px- Corner Radius: 6pxAvatar Color Mapping:- Payment/Success: #7C9070 / #7C907015- New/Info: #5B9BD5 / #5B9BD515- Pending/Warning: #D4845E / #D4845E15Pagination:- Active: #7C9070- Inactive: #E5E4E1
11. Data Table
Structure:├── Table Header Section (space_between)│   ├── Title Group (gap: 4px)│   │   ├── Title (20px, Fraunces, medium, #2D2D2D)│   │   └── Subtitle (12px, Plus Jakarta Sans, normal, #8E8E93)│   └── Actions (gap: 10px)│       └── Action Buttons × N (Search, Export)└── Table (cornerRadius: 12, stroke: 1px #F0EFEC)    ├── Header Row (#FAFAF8 background)    │   └── TH Cells × N (11px, Plus Jakarta Sans, semibold, #8E8E93)    └── Body Rows × N        └── TD Cells × NHeader Row:- Background: #FAFAF8- Padding: 14px 16px- Font: 11px, Plus Jakarta Sans, semibold, #8E8E93Body Row:- Padding: 14px 16px- Border Top: 1px solid #F0EFEC- Align: centerCell Typography:- Invoice ID: Space Mono, 13px, normal, #2D2D2D- Date: Plus Jakarta Sans, 13px, normal, #6B6B6B- Amount: Space Mono, 13px, medium, #2D2D2D- Status: Badge componentTable Action Button:- Background: #F7F6F3- Padding: 10px 14px- Corner Radius: 8px- Gap: 8px
12. Status Badge (Table)
Styling:- Padding: 4px 8px- Corner Radius: 6px- Font: 10px, Plus Jakarta Sans, semiboldStates:- Completed: bg #7C907015, text #7C9070- Pending: bg #D4845E15, text #D4845E- Active: bg #2D2D2D, text #FFFFFF- New: bg #5B9BD515, text #5B9BD5
13. Gallery Cards
Structure:├── Image Area (height: 100px)│   └── Icon (32px, lucide, #FFFFFF50 on colored bg)└── Content Area (gap: 8px)    ├── Title (14px, Plus Jakarta Sans, semibold, #2D2D2D)    ├── Description (12px, Plus Jakarta Sans, normal, #8E8E93, lineHeight: 1.5)    └── Metadata (11px, Plus Jakarta Sans, medium, #8E8E93)Image Area Colors:- Card 1: #7C9070 (sage)- Card 2: #C9B8A8 (taupe)- Card 3: #9B8AA8 (lavender)Styling:- Corner Radius: 16px- Clip: true- Shadow: blur 30px, y-offset 4px, color #00000006- Content Padding: 20px- Width: fill_container (3-column grid)- Cards Gap: 20px
14. Gallery Navigation
Structure:├── Prev Button (36x36, outlined)│   └── Chevron Left (16px, lucide, #8E8E93)└── Next Button (36x36, filled)    └── Chevron Right (16px, lucide, #FFFFFF)Prev Button:- Border: 1px solid #F0EFEC- Background: transparent- Corner Radius: 10pxNext Button:- Background: #2D2D2D- Corner Radius: 10pxGap: 8px
15. Banner/Alert
Structure:├── Left (gap: 14px)│   ├── Icon Container (32x32, #7C9070, cornerRadius: 8)│   │   └── Icon (16px, lucide, #FFFFFF)│   └── Message (13px, Plus Jakarta Sans, medium, #4A5D43)└── Dismiss (28x28, cornerRadius: 6)    └── X Icon (14px, lucide, #8E8E93)Styling:- Background: #7C907015- Border: 1px solid #7C907030- Padding: 16px 24px- Corner Radius: 14px- Justify: space_between- Align: center
16. User Avatar
Structure:└── Initials (13px, Plus Jakarta Sans, semibold, #FFFFFF, centered)Styling:- Size: 40x40- Background: #C9B8A8 (warm taupe)- Corner Radius: 12px- Justify/Align: center
🖼️ Icons
Icon Library
Family: LucideStyle: Outlined, consistent stroke width
Icon Sizes
Gallery Image Icons:    32pxNavigation Icons:       16pxButton Icons:           14-16pxSearch/Action Icons:    14-16pxTrend Indicators:       12px
Icon Color States
On Filled Buttons:       #FFFFFFOn Sage Backgrounds:     #7C9070On Colored Card Bg:      #FFFFFF50 (50% opacity)Inactive/Secondary:      #8E8E93Tertiary:               #6B6B6B
🏗️ Layout Structure
Desktop Dashboard Grid
┌──────────────────────────────────────────────────────────────┐│ ┌──────────────────────────────────────────────────────────┐ ││ │  Logo    │  Nav Items            │  Search  Upgrade  👤  │ ││ └──────────────────────────────────────────────────────────┘ ││ ┌──────────────────────────────────────────────────────────┐ ││ │  Breadcrumbs                                             │ ││ │  Page Title                        [Filter] [Date] [CTA] │ ││ │  Subtitle                                                │ ││ ├──────────────────────────────────────────────────────────┤ ││ │                                                          │ ││ │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │ ││ │  │ Metric │ │ Metric │ │ Metric │ │ Metric │            │ ││ │  └────────┘ └────────┘ └────────┘ └────────┘            │ ││ │                                                          │ ││ │  ┌────────────────────────────┐ ┌──────────────────────┐│ ││ │  │                            │ │                      ││ ││ │  │        Chart Card          │ │    Activity Card     ││ ││ │  │                            │ │                      ││ ││ │  └────────────────────────────┘ └──────────────────────┘│ ││ │                                                          │ ││ │  ┌────────────────────────────────────────────────────┐ │ ││ │  │                    Table Section                    │ │ ││ │  └────────────────────────────────────────────────────┘ │ ││ │                                                          │ ││ │  ┌────────────────────────────────────────────────────┐ │ ││ │  │                      Banner                         │ │ ││ │  └────────────────────────────────────────────────────┘ │ ││ │                                                          │ ││ │  ┌────────────────────────────────────────────────────┐ │ ││ │  │                   Gallery Section                   │ │ ││ │  └────────────────────────────────────────────────────┘ │ ││ └──────────────────────────────────────────────────────────┘ │└──────────────────────────────────────────────────────────────┘Total Width: 1440pxNavigation: Full-width horizontalContent Padding: 40px 48pxBackground: #F7F6F3
Content Layout
Direction: VerticalPadding: 40px 48pxGap: 32px between major sectionsClip: true (overflow hidden)Metrics Row:- Direction: Horizontal- Gap: 20px- Cards: fill_container width each (4-up)Main Row (Chart + Activity):- Direction: Horizontal- Gap: 20px- Chart: fill_container- Activity: 360px fixed widthGallery Items:- Direction: Horizontal- Gap: 20px- Cards: fill_container width each (3-up)
🎭 Design Language Summary
Key Visual Traits
Generous Radii — 8-16px corners create warmth and approachability
Whisper Shadows — Ultra-soft shadows (6% opacity) suggest depth gently
Sage Anchor — #7C9070 provides organic, calming accent
Serif Display — Fraunces brings editorial elegance to headings
Warm Paper — Off-white #F7F6F3 foundation feels natural
Tinted States — 15% opacity backgrounds for colored elements
Horizontal Nav — Top navigation opens up content area
Monospace Data — Space Mono for codes/values adds technical clarity
Dos
✅ Use Fraunces for display/headings, Plus Jakarta Sans for UI, Space Mono for data
✅ Use #7C9070 for primary actions, success states, and brand elements
✅ Use 15% opacity tints for colored backgrounds (#7C907015, #5B9BD515, etc.)
✅ Use generous corner radii (8-16px) for all containers
✅ Use ultra-soft shadows (blur 30px, 6% black) for cards
✅ Use #F7F6F3 as page background for warmth
✅ Use #F0EFEC for subtle borders and dividers
✅ Apply negative letter-spacing (-1px) to large Fraunces headings
✅ Use semantic accent colors consistently (sage=success, terracotta=warning, blue=info)
Don'ts
❌ Don't use sharp corners (0 radius) — this is a rounded system
❌ Don't use heavy shadows — keep them whisper-soft
❌ Don't use pure white (#FFFFFF) as page background — use warm off-white
❌ Don't mix font families beyond the Fraunces/Plus Jakarta/Space Mono trio
❌ Don't use solid accent colors as backgrounds — always use 15% tints
❌ Don't use dark borders — stick to #F0EFEC for subtlety
❌ Don't forget the serif — Fraunces is key to the editorial character
❌ Don't overcrowd — embrace the Scandinavian love of breathing room
📋 Quick Reference
Copy-Paste Color Tokens
/* Backgrounds */--bg-page: #F7F6F3;--bg-card: #FFFFFF;--bg-surface: #FAFAF8;/* Primary Accent (Sage) */--sage-primary: #7C9070;--sage-tint: #7C907015;--sage-border: #7C907030;--sage-text-on-bg: #4A5D43;/* Secondary Accents */--taupe: #C9B8A8;--blue: #5B9BD5;--blue-tint: #5B9BD515;--terracotta: #D4845E;--terracotta-tint: #D4845E15;--lavender: #9B8AA8;--lavender-tint: #9B8AA815;/* Neutral */--black-soft: #2D2D2D;--gray-600: #6B6B6B;--gray-500: #8E8E93;--gray-inactive: #E5E4E1;--border: #F0EFEC;
Typography Quick Ref
/* Families */--font-display: 'Fraunces', serif;--font-body: 'Plus Jakarta Sans', sans-serif;--font-mono: 'Space Mono', monospace;/* Sizes */--font-size-xs: 10px;--font-size-sm: 11px;--font-size-md: 12px;--font-size-base: 13px;--font-size-lg: 14px;--font-size-xl: 20px;--font-size-2xl: 36px;--font-size-3xl: 40px;/* Weights */--font-weight-semibold: 600;--font-weight-medium: 500;--font-weight-normal: 400;/* Letter Spacing */--letter-spacing-tight: -1px;--letter-spacing-snug: -0.5px;--letter-spacing-normal: 0;
Spacing Quick Ref
--space-1: 2px;--space-2: 4px;--space-3: 6px;--space-4: 8px;--space-5: 10px;--space-6: 12px;--space-7: 14px;--space-8: 16px;--space-9: 20px;--space-10: 24px;--space-11: 32px;--space-12: 40px;--space-13: 48px;
Corner Radius Quick Ref
--radius-sm: 4px;--radius-md: 6px;--radius-base: 8px;--radius-lg: 10px;--radius-xl: 12px;--radius-2xl: 14px;--radius-3xl: 16px;
Shadow Quick Ref
--shadow-card: 0 4px 30px #00000006;--shadow-nav: 0 4px 40px #00000008;--shadow-button: 0 2px 20px #00000008;
This design system represents a Scandinavian-inspired, warm minimal web dashboard aesthetic. The natural off-white foundation with sage green accents creates organic visual harmony while maintaining professional clarity. Generous corner radii and whisper-soft shadows project friendliness and approachability. The serif-sans typography pairing—elegant Fraunces for display and modern Plus Jakarta Sans for UI—creates sophisticated editorial character. Apply these principles consistently to maintain the calm, nature-inspired visual language.
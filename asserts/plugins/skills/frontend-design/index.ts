import skillMd from './SKILL.md?raw'

export const FRONTEND_DESIGN_SK_NAME = 'frontend-design'

export default {
    name: FRONTEND_DESIGN_SK_NAME,
    files: [
        {
            path: 'SKILL.md',
            content: skillMd,
        },
    ],
}
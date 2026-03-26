const PROTECTED_DIRS = ['node_modules', '.git']

const STATE_KEYS = {
  RECENT_FILES: 'mybricks.recentFiles',
  AI_CHANNEL_OVERRIDE: 'mybricks.aiChannelOverride',
  LAST_SAVE_DIR: 'mybricks.lastSaveDir',
}

module.exports = {
  PROTECTED_DIRS,
  STATE_KEYS,
}

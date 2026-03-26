import React from 'react'
import packageJson from '../../../package.json'
import styles from './index.module.less'

interface Props {
  appVersion: string | null
  designerVersion: string | null
  pluginAIVersion: string | null
  fileId: string | null
  aiChannel: 'infra' | 'mybricks' | null
  infraAvailable: boolean
  onSwitchToMybricks: () => void
  onSwitchToInfra: () => void
}

export default function DepInfoPopoverContent({
  appVersion,
  designerVersion,
  pluginAIVersion,
  fileId,
  aiChannel,
  infraAvailable,
  onSwitchToMybricks,
  onSwitchToInfra,
}: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <svg className={styles.headerIcon} viewBox="0 0 16 16" width="12" height="12">
          <path d="M7.443.505a1 1 0 011.114 0l6 4A1 1 0 0115 5.5v5a1 1 0 00-.443.995l-6 4a1 1 0 01-1.114 0l-6-4A1 1 0 011 10.5v-5a1 1 0 00.443-.995l6-4zM8 1.8L2.557 5.5 8 9.2l5.443-3.7L8 1.8zM2 6.756V10.5l5.5 3.667V10.42L2 6.756zM9.5 10.42v3.747L15 10.5V6.756L9.5 10.42z" />
        </svg>
        <span className={styles.headerTitle}>依赖库信息</span>
      </div>
      <div className={styles.body}>
        {packageJson.version && (
          <div className={styles.row} style={{ marginBottom: 5 }}>
            <span className={styles.label}>插件版本</span>
            <span className={styles.valuePrimary}>v{packageJson.version}</span>
          </div>
        )}
        {appVersion && (
          <div className={styles.row} style={{ marginBottom: designerVersion ? 5 : 0 }}>
            <span className={styles.label}>version</span>
            <span className={styles.valuePrimary}>v{appVersion}</span>
          </div>
        )}
        {designerVersion && (
          <div className={styles.row} style={{ marginBottom: pluginAIVersion ? 5 : 0 }}>
            <span className={styles.label}>设计器</span>
            <span className={styles.valueMuted}>v{designerVersion}</span>
          </div>
        )}
        {pluginAIVersion && (
          <div className={styles.row} style={{ marginBottom: fileId || aiChannel ? 5 : 0 }}>
            <span className={styles.label}>AI 插件</span>
            <span className={styles.valueMuted}>v{pluginAIVersion}</span>
          </div>
        )}
        {fileId && (
          <div className={styles.row} style={{ marginBottom: aiChannel ? 5 : 0 }}>
            <span className={styles.label}>文件 ID</span>
            <span className={styles.valueFileId}>{fileId}</span>
          </div>
        )}
        {aiChannel && (
          <div className={styles.row}>
            <span className={styles.label}>AI 渠道</span>
            <span
              className={
                aiChannel === 'mybricks'
                  ? styles.valueChannelMybricks
                  : styles.valueChannelInfra
              }
            >
              {aiChannel === 'infra' ? '默认' : 'MyBricks'}
            </span>
          </div>
        )}
        {infraAvailable && aiChannel === 'infra' && (
          <div className={styles.switchArea}>
            <button className={styles.switchBtnPrimary} onClick={onSwitchToMybricks}>
              切换至 MyBricks 渠道
            </button>
          </div>
        )}
        {infraAvailable && aiChannel === 'mybricks' && (
          <div className={styles.switchArea}>
            <button className={styles.switchBtnDefault} onClick={onSwitchToInfra}>
              切换至默认渠道
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

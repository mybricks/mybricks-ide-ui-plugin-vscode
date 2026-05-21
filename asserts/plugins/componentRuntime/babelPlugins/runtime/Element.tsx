import React, { useRef, useLayoutEffect, isValidElement, type PropsWithChildren } from 'react'

interface ElementProps extends PropsWithChildren {
  appConfig: Taro.AppConfig
  page: string
}
const Element = ({
  appConfig,
  children,
  page
}: ElementProps) => {
  const { tabBar } = appConfig
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
        }}
      >
        {isValidElement(children) ? React.cloneElement<any>(children, {
          ['data-loc']: children.props['data-loc'] || '1',
          ['_mybricks_page']: true
        }) : children}
      </div>
      {/* 占位 */}
      <div style={{ width: '100%', height: 50 }}></div>
      <div
        style={{
          marginBottom: 'env(safe-area-inset-bottom)',
          bottom: 0,
          width: '100%',
          height: 50,
          transition: 'bottom .2s, top .2s',
          position: 'absolute',
        }}
      >
        <div
          style={{
            display: 'flex',
            zIndex: 500,
            alignItems: 'center',
            width: '100%',
            position: 'absolute',
            bottom: 0,
            backgroundColor: tabBar.backgroundColor || 'rgb(255, 255, 255)',
            height: 'inherit',
          }}
        >
          {appConfig.tabBar?.list.map((tabBarItem) => {
            const isActive = tabBarItem.pagePath === page
            const iconPath = (isActive ? tabBarItem.selectedIconPath : tabBarItem.iconPath) || tabBarItem.iconPath
            const pColor = (isActive ? tabBar.selectedColor : tabBar.color) || '#999'
            return (
              <a
                href="javascript:;"
                style={{
                  padding: '5px 0',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  color: '#999',
                  textAlign: 'center',
                  // @ts-ignore copy from taro
                  '-webkit-tap-highlight-color': 'transparent',
                  flex: '1',
                  fontSize: 0,
                  display: 'block',
                  textDecoration: 'none'
                }}
              >
                <span style={{ display: 'inline-block', position: 'relative' }}>
                  <img style={{width: 27, height: 27, display: 'inline-block'}} src={iconPath}/>
                </span>
                <p
                  style={{
                    textAlign: 'center',
                    color: pColor,
                    fontSize: '10px',
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  {tabBarItem.text}
                </p>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { Element }
